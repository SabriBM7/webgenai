# backend/rag/vectorstore.py
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# Where your JSONL lives (unchanged)
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "components.jsonl"
INDEX_PATH = Path(__file__).resolve().parent / "index.faiss"

# Embedder
MODEL = SentenceTransformer("all-MiniLM-L6-v2")

# ---------- Load + build index ----------

def _load_entries() -> List[Dict[str, Any]]:
    """
    Load JSONL blueprints. Each line is a dict with:
      - type: str
      - tags: List[str]
      - propsSchema: dict
      - description or notes: str (optional)
    """
    entries: List[Dict[str, Any]] = []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            tags = obj.get("tags", [])
            notes = obj.get("description") or obj.get("notes") or ""
            props_schema = obj.get("propsSchema", {})

            # Text used for retrieval
            text = (
                f"type: {obj.get('type','')}\n"
                f"tags: {', '.join(tags)}\n"
                f"notes: {notes}\n"
                f"propsSchema: {json.dumps(props_schema, ensure_ascii=False)}"
            )

            entries.append({"text": text, "raw": obj})
    return entries

def _build_index(entries: List[Dict[str, Any]]):
    embeddings = MODEL.encode([e["text"] for e in entries], normalize_embeddings=True)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(np.array(embeddings, dtype="float32"))
    faiss.write_index(index, str(INDEX_PATH))
    return index

_ENTRIES: List[Dict[str, Any]] | None = None
_INDEX = None

def _ensure():
    global _ENTRIES, _INDEX
    if _ENTRIES is None:
        _ENTRIES = _load_entries()
    if _INDEX is None:
        if INDEX_PATH.exists():
            _INDEX = faiss.read_index(str(INDEX_PATH))
        else:
            _INDEX = _build_index(_ENTRIES)

# ---------- Helpers ----------

def _kw(tokens: str | List[str]) -> List[str]:
    if isinstance(tokens, str):
        tokens = tokens.lower()
        return re.findall(r"[a-z0-9]+", tokens)
    return [str(t).lower() for t in tokens]

def _boost_score(item: Dict[str, Any], query_terms: List[str], want_tags: List[str]) -> int:
    """
    Lightweight re-rank:
    - +1 for each query term that appears in type/tags/notes
    - +2 for each wanted tag found in item's tags
    """
    raw = item["raw"]
    hay = (
        (raw.get("type") or "") + " " +
        " ".join(raw.get("tags") or []) + " " +
        (raw.get("notes") or raw.get("description") or "")
    ).lower()
    base = sum(1 for t in query_terms if t in hay)
    tag_boost = sum(2 for tg in want_tags if tg in (raw.get("tags") or []))
    return base + tag_boost

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

# ---------- Public API ----------

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
    already re-ranked by tag/keyword relevance.

    Parameters
    ----------
    query : str
        Free-text like "restaurant modern cozy seasonal menu"
    industry : str
        Industry tag to boost (e.g., "restaurant", "ecommerce", "realestate")
    need_images : bool
        If True, inject a note telling the model to use HTTPS image URLs
    k : int
        Number of FAISS candidates to fetch before local re-rank
    """
    _ensure()

    # 1) vector search
    q_emb = MODEL.encode([query], normalize_embeddings=True).astype("float32")
    D, I = _INDEX.search(q_emb, k)
    cand_idx = [idx for idx in I[0] if idx >= 0]

    # 2) re-rank by tags/keywords
    q_terms = _kw(query)
    want_tags = [industry.lower()] if industry else []
    want_tags += ["general"]  # general blocks are usually useful

    candidates = [ _ENTRIES[i] for i in cand_idx ]
    candidates.sort(
        key=lambda it: _boost_score(it, q_terms, want_tags),
        reverse=True
    )

    # 3) take top-N and optionally inject https-image policy
    top: List[Dict[str, Any]] = []
    seen_types: set[str] = set()
    for ent in candidates[: min(len(candidates), 18) ]:  # slightly larger pool
        obj = ent["raw"].copy()
        # avoid returning many duplicates of same type unless industry-specific
        t = obj.get("type")
        if t in seen_types and "general" in (obj.get("tags") or []):
            continue
        seen_types.add(t)

        if need_images:
            obj = _inject_https_note(obj)

        top.append(obj)

    # 4) return JSON array string (easier for prompting)
    return json.dumps(top, ensure_ascii=False)


# backend/rag/vectorstore.py  (additions at the bottom)

def build_index() -> int:
    """
    Build (or overwrite) the FAISS index from DATA_PATH.
    Returns the number of entries indexed.
    """
    global _ENTRIES, _INDEX
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
    }

if __name__ == "__main__":
    n = rebuild_index()
    info = index_info()
    print(f"Index rebuilt ✅  entries={n}")
    print(info)
