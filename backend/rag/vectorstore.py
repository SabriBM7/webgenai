# backend/rag/vectorstore.py
import json, re, math
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter, defaultdict
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os, random
from functools import lru_cache
import hashlib
import requests

def _sig(*parts) -> str:
    raw = "||".join(str(p) for p in parts)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()

# Where your JSONL lives
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "components.jsonl"
INDEX_PATH = Path(__file__).resolve().parent / "index.faiss"

# Embedder
MODEL = SentenceTransformer("all-MiniLM-L6-v2")

# ---- Globals ----
_ENTRIES: List[Dict[str, Any]] | None = None          # [{"raw": <obj>, "blob": <str>}...]
_EMB_MATRIX: np.ndarray | None = None                 # (N, dim) normalized embeddings
_INDEX = None                                         # FAISS IP index over _EMB_MATRIX
_DIM: int | None = None

# Page role taxonomy (used by role-aware retrieval)
_PAGE_ROLES = ["header","hero","value","social-proof","media","conversion","core-content","footer"]

# ---- Lexical (tiny BM25-ish) caches ----
_LEX_READY = False
_DF = defaultdict(int)       # token -> doc freq
_IDF: Dict[str, float] = {}  # token -> idf
_DOC_TOKS: List[set] = []    # per-entry token sets, same order as _ENTRIES

# =========================
# Loading & Index building
# =========================
def _seed_from_payload(industry: str, style: str, description: str = "") -> int:
    # deterministic seed per combo; tweak if you want
    base = f"{industry}|{style}|{(description or '')[:64]}".lower()
    return abs(hash(base)) % (2**31)

def _shuffle_deterministic(items, seed: int):
    rng = random.Random(seed)
    items_copy = list(items)
    rng.shuffle(items_copy)
    return items_copy

def _mock_bucketed(entries, industry: str, seed: int, k_per_role: int = 4):
    """
    Fallback when RAG_MOCK=1: filter by industry if available, then bucket by pageRole, shuffle deterministically.
    """
    by_role = {r: [] for r in _PAGE_ROLES}
    for e in entries:
        raw = e["raw"] if "raw" in e else e  # handle both shapes
        # light industry filter (keep general if no industry match)
        inds = set((raw.get("industry") or []))
        if industry and not any(industry.lower() in s.lower() for s in inds):
            # keep if obviously general
            if "general" not in (raw.get("tags") or []):
                continue
        role = raw.get("pageRole", "aux")
        by_role.setdefault(role, [])
        by_role[role].append(raw)

    # pick top (seeded variety)
    templates_by_role = {}
    for role, items in by_role.items():
        picked = _shuffle_deterministic(items, seed)[:k_per_role]
        templates_by_role[role] = picked

    # flatten shortlist
    shortlist = []
    for r in ["header","hero","value","media","social-proof","conversion","core-content","footer"]:
        shortlist.extend(templates_by_role.get(r, [])[:2])  # simple cap

    # keywords/defaults
    image_keywords = sorted({kw for bucket in templates_by_role.values()
                             for d in bucket
                             for kw in (d.get("imageKeywords") or [])})[:16]
    schema_defaults = _collect_schema_defaults(shortlist)

    return {
        "templates": shortlist,
        "templates_by_role": templates_by_role,
        "image_keywords": image_keywords,
        "schema_defaults": schema_defaults,
        "debug": {"mock": True}
    }
@lru_cache(maxsize=256)
def _cached_retrieve_key(industry: str, style: str, qsig: str) -> dict:
    # This wrapper allows caching deterministic results for repeated queries
    # (You’ll pass a small signature "qsig" so different descriptions don’t collapse too much)
    return {}

def _entry_text_blob(e: Dict[str, Any]) -> str:
    """
    Rich text blob for embedding. Works with enriched entries.
    The JSON is the ground truth; this blob is just for retrieval.
    """
    r = e or {}
    parts = [
        f"type: {r.get('type','')}",
        "industry: " + " ".join(r.get("industry") or []),
        "tags: " + " ".join(r.get("tags") or []),
        "description: " + (r.get("description") or r.get("notes") or ""),
        "propsSchemaKeys: " + " ".join(r.get("propsSchemaKeys") or []),
        "synonyms: " + " ".join(r.get("synonyms") or []),
        f"pageRole: {r.get('pageRole','')}",
        ]
    return " | ".join([p for p in parts if p.strip()])

def _load_entries() -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"components.jsonl not found at {DATA_PATH}")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            blob = _entry_text_blob(obj) if obj else ""
            if not blob:
                tags = obj.get("tags", [])
                notes = obj.get("description") or obj.get("notes") or ""
                props_schema = obj.get("propsSchema", {})
                blob = (
                    f"type: {obj.get('type','')}\n"
                    f"tags: {', '.join(tags)}\n"
                    f"notes: {notes}\n"
                    f"propsSchema: {json.dumps(props_schema, ensure_ascii=False)}"
                )
            entries.append({"raw": obj, "blob": blob})
    return entries


def _build_index(entries: List[Dict[str, Any]]):
    global _EMB_MATRIX, _INDEX, _DIM
    texts = [e["blob"] for e in entries]
    embs = MODEL.encode(texts, normalize_embeddings=True)
    _EMB_MATRIX = np.array(embs, dtype="float32")
    _DIM = _EMB_MATRIX.shape[1]
    index = faiss.IndexFlatIP(_DIM)
    index.add(_EMB_MATRIX)
    faiss.write_index(index, str(INDEX_PATH))
    _INDEX = index

    # build lexical stats in same order as entries
    _build_lex_stats(entries)
    return index

def _ensure():
    global _ENTRIES, _INDEX, _EMB_MATRIX, _DIM
    if _ENTRIES is None:
        _ENTRIES = _load_entries()
    if _INDEX is None:
        if INDEX_PATH.exists():
            _INDEX = faiss.read_index(str(INDEX_PATH))
            # Also rebuild _EMB_MATRIX in-memory so we can role-filter w/out FAISS requery
            texts = [e["blob"] for e in _ENTRIES]
            embs = MODEL.encode(texts, normalize_embeddings=True)
            _EMB_MATRIX = np.array(embs, dtype="float32")
            _DIM = _EMB_MATRIX.shape[1]
            # rebuild lexical stats
            _build_lex_stats(_ENTRIES)
        else:
            _INDEX = _build_index(_ENTRIES)

# =========================
# Helpers
# =========================

def _kw(tokens: str | List[str]) -> List[str]:
    if isinstance(tokens, str):
        tokens = tokens.lower()
        return re.findall(r"[a-z0-9]+", tokens)
    return [str(t).lower() for t in tokens]

def _inject_https_note(obj: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add a small note to remind the LLM that all image fields must be HTTPS URLs.
    This keeps your dataset immutable while enforcing policy at retrieval time.
    """
    if not obj:
        return obj
    note = "IMAGE_URL_POLICY: use full HTTPS URLs (Unsplash or Picsum). No local filenames."
    if obj.get("notes"):
        if "IMAGE_URL_POLICY" not in obj["notes"]:
            obj["notes"] = f"{obj['notes']}  {note}"
    else:
        obj["notes"] = note
    return obj

# --- Add to rag/vectorstore.py ---

def _collect_schema_defaults(components: list[dict]) -> dict:
    """
    Merge exampleProps and propsSchema keys per type so the generator
    sees baseline shapes. exampleProps win; propsSchema keys get set to None
    if not already provided by exampleProps.
    """
    merged: dict[str, dict] = {}

    for c in components or []:
        t = c.get("type")
        if not t:
            continue
        merged.setdefault(t, {})

        # Prefer exampleProps if present
        for k, v in (c.get("exampleProps") or {}).items():
            if k not in merged[t]:
                merged[t][k] = v

        # Ensure schema keys are present at least as null defaults
        for k in (c.get("propsSchema") or {}).keys():
            merged[t].setdefault(k, None)

    return merged

def _gather_image_keywords(components: list[dict]) -> list[str]:
    """
    Collect imageKeywords from selected components (deduped, trimmed).
    """
    kws = []
    for c in components or []:
        kws.extend(c.get("imageKeywords") or [])
    # de-dupe and keep it compact
    out = []
    seen = set()
    for w in kws:
        key = str(w).strip().lower()
        if key and key not in seen:
            out.append(str(w).strip())
            seen.add(key)
    return out[:24]  # cap a bit


def _cosine_dot_normed(query_vec: np.ndarray, entry_vecs: np.ndarray) -> np.ndarray:
    """
    All vectors are already L2-normalized → cosine = dot.
    query_vec (dim,), entry_vecs (N, dim)
    returns (N,)
    """
    return entry_vecs.dot(query_vec)
# =========================
# Diversity / MMR helpers
# =========================
def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    # vectors are L2-normalized already
    return float(np.dot(a, b))

def _mmr_select(candidates, topn: int = 3, lambda_: float = 0.7):
    """
    candidates: list of dicts with keys:
      - "vec": np.ndarray (dim,)
      - "score": float  (hybrid score)
    Returns a subset with high relevance + low redundancy.
    """
    selected = []
    pool = candidates[:]  # copy
    while pool and len(selected) < topn:
        def mmr_value(c):
            redundancy = max((_cosine(c["vec"], s["vec"]) for s in selected), default=0.0)
            return lambda_ * c["score"] - (1.0 - lambda_) * redundancy
        best = max(pool, key=mmr_value)
        selected.append(best)
        pool.remove(best)
    return selected
# ---- Lexical scoring (tiny BM25-ish) ----

def _tok(s: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", (s or "").lower())

def _entry_text_for_lex(raw: Dict[str, Any]) -> str:
    return " ".join([
        str(raw.get("type","")),
        " ".join(raw.get("tags") or []),
        str(raw.get("description","") or raw.get("notes","")),
        json.dumps(raw.get("propsSchema", {}), ensure_ascii=False),
    ]).lower()

def _build_lex_stats(entries: List[Dict[str, Any]]) -> None:
    global _LEX_READY, _DF, _IDF, _DOC_TOKS
    _DF.clear()
    _DOC_TOKS = []
    for ent in entries:
        raw = ent["raw"]
        toks = set(_tok(_entry_text_for_lex(raw)))
        _DOC_TOKS.append(toks)
        for t in toks:
            _DF[t] += 1
    N = max(1, len(entries))
    _IDF = {t: math.log((N - df + 0.5) / (df + 0.5) + 1.0) for t, df in _DF.items()}
    _LEX_READY = True

def _lexical_score(query: str, doc_idx: int) -> float:
    if not _LEX_READY or doc_idx < 0 or doc_idx >= len(_DOC_TOKS):
        return 0.0
    q_toks = _tok(query)
    if not q_toks:
        return 0.0
    d_toks = _DOC_TOKS[doc_idx]
    num = sum(_IDF.get(t, 0.0) for t in set(q_toks) if t in d_toks)
    den = 1.0 + math.log(1.0 + len(d_toks))
    raw = num / den
    return min(raw, 0.2)  # cap the influence

def _hybrid_score(
        *,
        sim: float,
        item: Dict[str, Any],
        idx: int,
        query: str,
        industry: str,
        need_images: bool,
        role_hint: Optional[str] = None,
) -> float:
    raw = item["raw"]
    tags = [t.lower() for t in (raw.get("tags") or [])]
    inds = [str(i).lower() for i in (raw.get("industry") or [])]
    industry_l = (industry or "").lower().strip()

    tag_boost = 0.2 if (industry_l and (industry_l in tags or industry_l in inds)) else 0.0

    # simple image-fit: if caller needs images and schema has image-ish keys
    ps = raw.get("propsSchema", {}) or {}
    image_fit = 0.0
    for k in ps.keys():
        lk = k.lower()
        if "image" in lk or lk in {"src","avatar","logo","background","photo","icon"}:
            image_fit = 0.1
            break

    role_fit = 0.0
    pr = (raw.get("pageRole") or "").lower()
    if role_hint and pr == role_hint.lower():
        role_fit = 0.2

    lex = _lexical_score(query, idx)  # 0..~0.2

    return float(sim) + tag_boost + image_fit + role_fit + lex

# =========================
# Legacy public API (now hybrid re-ranked)
# =========================
# =========================
# Bucketed (page composition) retrieval
# =========================

ORDER_ROLES = ["header", "hero", "value", "media", "social-proof", "conversion", "core-content", "aux", "footer"]

def _trim_view(e: Dict[str, Any]) -> Dict[str, Any]:
    """Only expose fields the LLM should see."""
    return {
        "id": e.get("id"),
        "type": e.get("type"),
        "industry": e.get("industry", []),
        "tags": e.get("tags", []),
        "description": e.get("description"),
        "propsSchema": e.get("propsSchema", {}),
        "propsSchemaKeys": e.get("propsSchemaKeys", []),
        "mustHave": e.get("mustHave", []),
        "exampleProps": e.get("exampleProps", {}),
        "imagesRequired": e.get("imagesRequired", False),
        "imageKeywords": e.get("imageKeywords", []),
        "pageRole": e.get("pageRole", "aux"),
    }
def _generate_unsplash_image_url(keywords: List[str], width: int = 1600, height: int = 1200) -> str:
    """
    Generate a dynamic Unsplash image URL based on keywords
    """
    if not keywords:
        return f"https://picsum.photos/{width}/{height}"

    # Join keywords and sanitize
    query = "+".join([k.replace(" ", "+") for k in keywords[:3]])

    # Add some randomness to get different images
    random_seed = random.randint(1, 1000)

    # Use Unsplash source URL
    return f"https://source.unsplash.com/featured/{width}x{height}/?{query}&sig={random_seed}"

def _replace_static_images_with_dynamic_inplace(component: Dict[str, Any], industry: str, image_keywords: List[str]) -> None:
    """
    Replace static image URLs with dynamically generated ones based on industry (in-place)
    """
    if not component or not isinstance(component, dict):
        return

    # Industry-specific default keywords
    industry_keywords_map = {
        "restaurant": ["food", "restaurant", "cuisine", "dining", "chef", "meal"],
        "technology": ["technology", "software", "computer", "digital", "code", "laptop"],
        "healthcare": ["healthcare", "medical", "hospital", "wellness", "doctor", "nurse"],
        "beauty": ["beauty", "spa", "skincare", "wellness", "relaxation", "salon"],
        "fitness": ["fitness", "gym", "workout", "health", "exercise", "training"],
        "legal": ["legal", "law", "court", "justice", "lawyer", "attorney"],
        "real estate": ["real estate", "property", "home", "house", "architecture", "interior"],
        "education": ["education", "school", "learning", "classroom", "students", "books"],
        "photography": ["photography", "camera", "photo", "art", "creative", "portrait"],
        "business consulting": ["business", "consulting", "office", "meeting", "strategy", "analysis"],
        "e-commerce": ["ecommerce", "shopping", "online", "retail", "products", "packages"],
        "travel": ["travel", "tourism", "vacation", "destination", "adventure", "landscape"],
        "construction": ["construction", "architecture", "building", "design", "blueprint", "tools"],
        "automotive": ["automotive", "car", "vehicle", "transportation", "mechanic", "engineering"],
        "fashion": ["fashion", "clothing", "style", "apparel", "model", "design"],
        "finance": ["finance", "banking", "money", "investment", "economy", "business"],
        "non-profit": ["nonprofit", "charity", "community", "help", "volunteer", "donation"],
        "event planning": ["events", "planning", "celebration", "party", "wedding", "conference"],
        "interior design": ["interior", "design", "home", "decor", "furniture", "architecture"],
        "marketing": ["marketing", "advertising", "brand", "digital", "social media", "campaign"]
    }

    # Use provided keywords or fallback to industry-specific ones
    effective_keywords = image_keywords if image_keywords else []
    if not effective_keywords and industry:
        effective_keywords = industry_keywords_map.get(industry.lower(), [industry])

    # If still no keywords, use a default
    if not effective_keywords:
        effective_keywords = ["business", "professional", "office"]

    def replace_image_urls(obj):
        if isinstance(obj, dict):
            for key, value in obj.items():
                key_lower = key.lower()
                # Check if this is an image field
                is_image_field = (
                        "image" in key_lower or
                        key_lower in {"src", "icon", "avatar", "logo", "background", "photo", "thumbnail"}
                )

                if isinstance(value, str) and is_image_field:
                    if value.startswith(("http://", "https://")):
                        # Replace with dynamic image
                        obj[key] = _generate_unsplash_image_url(effective_keywords)
                elif isinstance(value, (dict, list)):
                    replace_image_urls(value)
        elif isinstance(obj, list):
            for item in obj:
                replace_image_urls(item)

    replace_image_urls(component)
def retrieve_bucketed_context(
        *,
        q_terms: List[str],
        industry: str = "",
        need_images: bool = True,
        k_per_role: int = 20,
        role_hints: Optional[List[str]] = None,
) -> dict:
    """
    Role-bucketed retrieval with hybrid scoring + MMR diversity.
    Returns a DICT:
    {
      "templates": [ ...trimmed entries in a good order... ],
      "templates_by_role": { role: [raw entries] },
      "image_keywords": [ ...deduped... ],
      "copy_notes": [ ...short bullets... ],
      "schema_defaults": { "<TypeName>": <exampleProps merged / defaults> },
      "debug": {...}
    }
    """
    _ensure()

    # --- Mock mode (no embeddings required) ---
    if os.getenv("RAG_MOCK") == "1":
        seed = _seed_from_payload(industry or "", (q_terms[1] if len(q_terms) > 1 else ""))
        return _mock_bucketed([e["raw"] for e in (_ENTRIES or [])], industry or "", seed, k_per_role)

    roles = role_hints or ORDER_ROLES

    selected_per_role: Dict[str, List[Dict[str, Any]]] = {}
    all_selected: List[Dict[str, Any]] = []

    for role in roles:
        # Wider pool per role; MMR happens in search_entries_composite
        cands = search_entries_composite(
            q_terms=q_terms,
            role=role,
            industry=industry,
            need_images=need_images,
            k=k_per_role,
            extra_boost_tags=[industry] if industry else None,
            use_mmr=True,
        )

        # Pick fewer for singleton roles
        topn = 1 if role in ("header", "hero", "footer") else 2
        picked = cands[:topn]

        # Ensure pageRole set on raw objects
        for p in picked:
            p.setdefault("pageRole", role)


        selected_per_role[role] = picked
        all_selected.extend(picked)
    image_keywords: List[str] = []
    seen_kw = set()
    for e in all_selected:
        for kw in (e.get("imageKeywords") or []):
            k = str(kw).strip()
            if not k:
                continue
            lk = k.lower()
            if lk not in seen_kw:
                image_keywords.append(k)
                seen_kw.add(lk)

    # Now apply image replacement to all selected components
    if need_images and image_keywords:
        for role in roles:
            for component in selected_per_role.get(role, []):
                _replace_static_images_with_dynamic_inplace(component, industry, image_keywords)

        for component in all_selected:
            _replace_static_images_with_dynamic_inplace(component, industry, image_keywords)

    # Final ordered slate (trim view + carry score/role)
    ordered_templates: List[Dict[str, Any]] = []
    seen_ids = set()
    for role in roles:
        for e in selected_per_role.get(role, []):
            inferred_role = e.get("pageRole", role)
            eid = e.get("id") or f"{(e.get('type') or '').strip()}.{inferred_role}"
            if eid in seen_ids:
                continue
            seen_ids.add(eid)

            trimmed = _trim_view(e)
            trimmed["pageRole"] = inferred_role
            if "_score" in e:
                trimmed["_score"] = e["_score"]
            trimmed["_role"] = inferred_role
            ordered_templates.append(trimmed)

    # Merge schema defaults
    schema_defaults: Dict[str, Any] = {}
    for e in all_selected:
        t = e.get("type")
        if not t:
            continue
        if t not in schema_defaults:
            defaults = dict(e.get("exampleProps") or {})
            for key in (e.get("propsSchema") or {}).keys():
                defaults.setdefault(key, None)
            schema_defaults[t] = defaults

    # Copy notes: short hints the model should consider
    copy_notes = []
    if industry:
        copy_notes.append(f"Use a tone/style appropriate for the {industry} industry.")
    copy_notes.append("Avoid placeholder lorem; write concise, production-ready copy.")
    if need_images:
        copy_notes.append("Use images.unsplash.com or picsum.photos HTTPS images only.")
    copy_notes.append("Respect propsSchema and mustHave keys for each component.")

    return {
        "templates": ordered_templates,
        "templates_by_role": selected_per_role,
        "image_keywords": image_keywords,
        "copy_notes": copy_notes,
        "schema_defaults": schema_defaults,
        "debug": {
            "query_terms": [t for t in q_terms if t],
            "roles": {r: [t.get("type") for t in selected_per_role.get(r, [])] for r in roles},
        }
    }
def retrieve_by_roles_payload(
        *,
        q_terms: List[str],
        industry: str = "",
        style: str = "",
        need_images: bool = True,
        role_hints: Optional[List[str]] = None,
        k: int = 6,
) -> dict:
    """
    Thin wrapper that:
      - supports mock mode (env RAG_MOCK=1)
      - warms a small LRU cache by (industry, style, roles, k, qsig)
      - returns a DICT with templates, image_keywords, schema_defaults, debug
    """
    _ensure()
    roles = role_hints or ORDER_ROLES

    # Mock mode (raw dicts)
    if os.getenv("RAG_MOCK") == "1":
        seed = _seed_from_payload(industry or "", style or "", " ".join(q_terms))
        raw_entries = [e["raw"] for e in (_ENTRIES or [])]
        return _mock_bucketed(raw_entries, industry or "", seed, k_per_role=max(k, 2))

    # Stable signature + warm cache
    qsig = _sig(industry, style, " ".join(q_terms)[:256], need_images, ",".join(roles), k)
    _cached_bucketed_key.cache_clear()
    _cached_bucketed_key(industry, style, need_images, max(k, 2), tuple(roles), qsig)

    # Compute via bucketed (keeps `_score` inside templates)
    view = retrieve_bucketed_context(
        q_terms=q_terms,
        industry=industry,
        need_images=need_images,
        k_per_role=max(k, 2),
        role_hints=roles,
    )
    return view

@lru_cache(maxsize=256)
def _cached_bucketed_key(
        industry: str,
        style: str,
        need_images: bool,
        k_per_role: int,
        role_hints_tuple: tuple,
        qsig: str,
) -> str:
    """
    Signature-only cache. We don't compute retrieval here.
    It simply caches the key so repeated identical requests are throttled.
    Real retrieval is done outside (deterministic, easier to test).
    """
    return qsig

def retrieve_context(
        query: str,
        *,
        industry: str = "",
        need_images: bool = True,
        k: int = 16,
) -> str:
    """
    Retrieve a relevant subset of component blueprints.

    Returns a JSON **array** string of component objects (not JSONL),
    re-ranked by vector + tiny lexical + tag/image bonuses (hybrid).
    """
    _ensure()

    # 1) vector search
    q_emb = MODEL.encode([query], normalize_embeddings=True).astype("float32")
    D, I = _INDEX.search(q_emb, k)
    cand_idx = [idx for idx in I[0] if idx >= 0]

    # 2) hybrid re-rank
    # map idx->sim
    sim_map = {idx: float(sim) for idx, sim in zip(I[0], D[0]) if idx >= 0}
    scored = []
    for idx in cand_idx:
        ent = _ENTRIES[idx]
        h = _hybrid_score(
            sim=sim_map.get(idx, 0.0),
            item=ent,
            idx=idx,
            query=query,
            industry=industry,
            need_images=need_images,
            role_hint=None,  # role-agnostic here
        )
        scored.append((h, idx, ent))
    scored.sort(key=lambda x: x[0], reverse=True)

    # 3) take top-N and optionally inject https-image policy
    top: List[Dict[str, Any]] = []
    seen_types: set[str] = set()
    for _, idx, ent in scored[: min(len(scored), 18) ]:
        obj = ent["raw"].copy()
        t = obj.get("type")
        if t in seen_types and "general" in (obj.get("tags") or []):
            continue
        seen_types.add(t)
        if need_images:
            obj = _inject_https_note(obj)
        top.append(obj)

    return json.dumps(top, ensure_ascii=False)

# =========================
# New: Composite / Role-aware
# =========================

def search_entries_composite(
        q_terms: List[str],
        role: Optional[str] = None,
        industry: Optional[str] = None,
        need_images: bool = False,
        k: int = 5,
        extra_boost_tags: Optional[List[str]] = None,
        use_mmr: bool = True,
        mmr_lambda: float = 0.7,
) -> List[Dict[str, Any]]:
    """
    Role-aware search with hybrid scoring + MMR diversity:
      - embed concatenated q_terms
      - filter by pageRole and industry
      - score with hybrid score (vector + lexical + tag/image + role fit)
      - apply MMR to reduce redundancy
    Returns a list of raw entry dicts.
    """
    _ensure()
    query = " ".join([t for t in q_terms if t]).strip()
    if not query:
        return []

    q_vec = MODEL.encode([query], normalize_embeddings=True).astype("float32")[0]

    # Filter candidate indices by role/industry upfront
    cand_indices: List[int] = []
    for i, ent in enumerate(_ENTRIES):
        raw = ent["raw"] or {}
        if role and raw.get("pageRole") != role:
            continue
        if industry:
            inds = set((raw.get("industry") or []))
            lowset = {x.lower() for x in inds}
            ilow = industry.lower()
            if (ilow not in lowset) and (not any(ilow in x for x in lowset)):
                continue
        cand_indices.append(i)

    if not cand_indices:
        return []

    # Vectors + cosine sims
    cand_vecs = _EMB_MATRIX[cand_indices]  # (M, dim)
    sims = cand_vecs.dot(q_vec)            # (M,)

    # Hybrid score each candidate (includes tiny lexical bonus)
    scored = []
    for j, idx in enumerate(cand_indices):
        ent = _ENTRIES[idx]
        h = _hybrid_score(
            sim=float(sims[j]),
            item=ent,
            idx=idx,
            query=query,
            industry=industry or "",
            need_images=need_images,
            role_hint=role,
        )

        # tiny deterministic jitter to break ties, stable for same (role, industry, query)
        if role:
            seed_str = f"{role}|{industry or ''}|{query}"
            h += (abs(hash(seed_str + str(idx))) % 1000) / 1e7  # 0..0.0001

        # optional tiny extra tag boosts...

        # optional tiny extra tag boosts
        if extra_boost_tags:
            raw = ent["raw"] or {}
            entry_tags = " ".join(raw.get("tags") or []).lower()
            for t in extra_boost_tags:
                if t and t.lower() in entry_tags:
                    h += 0.05

        # Keep vec + score for MMR
        scored.append({
            "score": h,
            "vec": cand_vecs[j],
            "ent": ent,
        })

    # Sort by relevance first (helps MMR seed from strong items)
    scored.sort(key=lambda x: x["score"], reverse=True)

    # MMR for diversity
    picked = _mmr_select(scored, topn=k, lambda_=mmr_lambda) if use_mmr else scored[:k]

    # Finalize objects (inject HTTPS policy if needed)
    # Finalize objects (inject HTTPS policy if needed)
    results: List[Dict[str, Any]] = []
    for c in picked:
        obj = (c["ent"]["raw"] or {}).copy()
        if need_images:
            obj = _inject_https_note(obj)
        obj["_score"] = round(float(c["score"]), 6)  # <-- carry score to the caller
        results.append(obj)
    return results


def retrieve_by_roles(
        q_terms: List[str],
        roles: List[str],
        industry: Optional[str],
        need_images: bool,
        k_per_role: int = 3,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Get the best candidates per pageRole.
    Returns a dict: role -> [raw entry dicts]
    """
    out: Dict[str, List[Dict[str, Any]]] = {}
    for r in roles:
        out[r] = search_entries_composite(
            q_terms=q_terms,
            role=r,
            industry=industry,
            need_images=need_images,
            k=k_per_role,
            extra_boost_tags=[industry] if industry else None,
        )
    return out

# =========================
# Utility / maintenance
# =========================

def build_index() -> int:
    """
    Build (or overwrite) the FAISS index from DATA_PATH.
    Returns the number of entries indexed.
    """
    global _ENTRIES, _INDEX, _EMB_MATRIX, _DIM
    _ENTRIES = _load_entries()
    _INDEX = _build_index(_ENTRIES)
    return len(_ENTRIES)

def rebuild_index() -> int:
    """
    Force a rebuild even if an index already exists.
    """
    if INDEX_PATH.exists():
        INDEX_PATH.unlink()
    return build_index()

def index_info() -> dict:
    """
    Quick diagnostics for debugging.
    """
    _ensure()
    return {
        "data_path": str(DATA_PATH),
        "index_path": str(INDEX_PATH),
        "entries": len(_ENTRIES or []),
        "dim": _DIM,
        "roles_present": sorted({(e["raw"] or {}).get("pageRole","") for e in (_ENTRIES or [])}),
        "industries_present": sorted({t for e in (_ENTRIES or []) for t in (e["raw"] or {}).get("industry", [])}),
    }

if __name__ == "__main__":
    n = rebuild_index()
    info = index_info()
    print(f"Index rebuilt ✅  entries={n}")
    print(info)
