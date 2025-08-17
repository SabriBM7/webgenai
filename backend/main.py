from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv
import os, json, re
import google.generativeai as genai
from urllib.parse import urlparse, urlunparse

# 1) Load .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing. Put it in backend/.env")

# 2) Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# 3) RAG retriever (returns a JSON ARRAY string and supports tag boosting)
from rag.vectorstore import retrieve_context

# 4) FastAPI + CORS
app = FastAPI(title="WebGenAI Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5) Schemas
class GenerateRequest(BaseModel):
    business_name: str
    description: str
    industry: str
    style: str
    images: bool = True
    target_audience: Optional[str] = None
    business_goals: Optional[str] = None
    unique_selling_points: Optional[str] = None
    ai_provider: Optional[str] = "gemini-rag"

class Component(BaseModel):
    id: str
    type: str
    tags: Optional[List[str]] = None
    props: dict

class GenerateResponse(BaseModel):
    success: bool
    websiteName: Optional[str] = None
    industry: Optional[str] = None
    style: Optional[str] = None
    tags: Optional[List[str]] = None
    components: Optional[List[Component]] = None
    error: Optional[str] = None

# 6) Health check
@app.get("/api/health")
def health():
    return {"ok": True, "model": GEMINI_MODEL}

# Helper: build a model with a system instruction
def make_model(system_msg: str):
    return genai.GenerativeModel(GEMINI_MODEL, system_instruction=system_msg)

# -------- Image URL sanitizers (updated & hardened) --------
UNSPLASH_PAGE_RE = re.compile(r"^https?://(?:www\.)?unsplash\.com/photos/([A-Za-z0-9_-]+)")
ALLOWED_IMG_HOSTS = {"images.unsplash.com", "picsum.photos", "img.icons8.com"}
PICSUM_FALLBACK = "https://picsum.photos/seed/placeholder/1200/800"


def _coerce_https(u: str) -> str:
    if isinstance(u, str) and u.startswith("http://"):
        return "https://" + u[len("http://"):]
    return u

def _unsplash_page_to_direct(u: str) -> str:
    """Convert unsplash.com/photos/<id> to a direct images.unsplash.com URL."""
    if not isinstance(u, str):
        return u
    m = UNSPLASH_PAGE_RE.match(u.strip())
    if m:
        photo_id = m.group(1)
        return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=1600&q=80"
    return u

def _normalize_unsplash_hosts(u: str) -> str:
    """plus.unsplash.com often 403s → rewrite to images.unsplash.com."""
    if not isinstance(u, str) or not u.startswith("http"):
        return u
    p = urlparse(u)
    if (p.hostname or "").lower() == "plus.unsplash.com":
        p = p._replace(netloc="images.unsplash.com")
        return urlunparse(p)
    return u

def _normalize_unsplash_query(u: str) -> str:
    """
    Strip Unsplash tracking params and force stable, large crop.
    Works for images.unsplash.com URLs.
    """
    if not isinstance(u, str):
        return u
    p = urlparse(u)
    if (p.hostname or "").lower() == "images.unsplash.com":
        return f"{p.scheme}://{p.netloc}{p.path}?auto=format&fit=crop&w=1600&q=80"
    return u

def _ensure_allowed(u: str) -> str:
    """Allow only known-good hosts; replace others with a placeholder."""
    if not isinstance(u, str) or not u.startswith("http"):
        return PICSUM_FALLBACK
    host = (urlparse(u).hostname or "").lower()
    return u if host in ALLOWED_IMG_HOSTS else PICSUM_FALLBACK

def _is_img_key(k: str) -> bool:
    k = (k or "").lower()
    # Treat these as image-like fields
    return (
        "image" in k
        or k in {"src", "icon", "avatar", "thumbnail", "logo", "background", "photo"}
        or k.endswith(("image", "src", "avatar", "background", "photo"))
    )

def sanitize_images_in_obj(obj):
    """
    Walk the JSON and sanitize any image-like values:
      - coerce http->https
      - convert unsplash pages to images.unsplash.com
      - rewrite plus.unsplash.com -> images.unsplash.com
      - strip tracking params on Unsplash; set consistent size/quality
      - restrict to allowlist (else fallback to Picsum)
    """
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if _is_img_key(k) and isinstance(v, str):
                u = _coerce_https(v)
                u = _unsplash_page_to_direct(u)
                u = _normalize_unsplash_hosts(u)
                u = _normalize_unsplash_query(u)  # <— NEW
                u = _ensure_allowed(u)
                out[k] = u
            else:
                out[k] = sanitize_images_in_obj(v)
        return out
    if isinstance(obj, list):
        return [sanitize_images_in_obj(x) for x in obj]
    return obj

def _coerce_https(u: str) -> str:
    if isinstance(u, str) and u.startswith("http://"):
        return "https://" + u[len("http://"):]
    return u

def _unsplash_page_to_direct(u: str) -> str:
    """Convert unsplash.com/photos/<id> to a direct images.unsplash.com URL."""
    if not isinstance(u, str):
        return u
    m = UNSPLASH_PAGE_RE.match(u.strip())
    if m:
        photo_id = m.group(1)
        # Use a widely compatible variant; query keeps size/compression reasonable.
        return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=1600&q=80"
    return u

def _normalize_unsplash_hosts(u: str) -> str:
    """
    plus.unsplash.com (premium CDN) often 403s. Repoint to images.unsplash.com with same path/query.
    """
    if not isinstance(u, str) or not u.startswith("http"):
        return u
    p = urlparse(u)
    host = (p.hostname or "").lower()
    if host == "plus.unsplash.com":
        p = p._replace(netloc="images.unsplash.com")
        return urlunparse(p)
    return u

def _ensure_allowed(u: str) -> str:
    """Allow only known-good hosts; replace others with a placeholder."""
    if not isinstance(u, str) or not u.startswith("http"):
        return PICSUM_FALLBACK
    host = (urlparse(u).hostname or "").lower()
    if host in ALLOWED_IMG_HOSTS:
        return u
    return PICSUM_FALLBACK

def _is_img_key(k: str) -> bool:
    k = k.lower()
    # treat these as image-like fields
    return (
        "image" in k
        or k in {"src", "icon", "avatar", "thumbnail", "logo", "background", "photo"}
        or k.endswith(("Image", "Src", "Avatar", "Background"))
    )

def sanitize_images_in_obj(obj):
    """
    Walk the JSON and sanitize any image-like values:
      - coerce http->https
      - convert unsplash pages to images.unsplash.com
      - rewrite plus.unsplash.com -> images.unsplash.com
      - restrict to allowlist (else fallback to Picsum)
    """
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if _is_img_key(k) and isinstance(v, str):
                u = _coerce_https(v)
                u = _unsplash_page_to_direct(u)
                u = _normalize_unsplash_hosts(u)
                u = _ensure_allowed(u)
                out[k] = u
            else:
                out[k] = sanitize_images_in_obj(v)
        return out
    if isinstance(obj, list):
        return [sanitize_images_in_obj(x) for x in obj]
    return obj

# 7) Main generation endpoint
@app.post("/api/generate-website", response_model=GenerateResponse)
def generate_website(payload: GenerateRequest):
    try:
        # --- RAG: vector search + re-rank with tag boosts; returns JSON ARRAY string ---
        templates = retrieve_context(
            f"{payload.industry} {payload.style} {payload.description}",
            industry=payload.industry,
            need_images=payload.images,
            k=40,  # wider pool
        ) or "[]"
        print("\n[DEBUG] Retrieved templates (first 1k chars):\n", templates[:1000], "...\n")

        # ---------- Industry-specific rules (Restaurant & Food) ----------
        industry_rules = ""
        if (payload.industry or "").lower() in ["restaurant", "food", "restaurant & food"]:
            industry_rules = """
            Industry-specific requirements (Restaurant):
            - Output 10–12 components in this rough order:
              Header → Hero → AwardsBar/PressLogos → IntroSection → ValueBadges or Stats →
              RestaurantMenu (2–4 categories, 3–6 items each) → DishGrid or SpecialsCarousel →
              SplitFeature (e.g., ‘Seasonal Menu’/‘Private Dining’) → ReservationForm or CTASection →
              Gallery (6–9 images) → Testimonials/TestimonialHighlight → FAQ → Hours → LocationMap → Footer.
            - Copy requirements:
              • IntroSection.text: 60–120 words describing cuisine, ambience, and USP (no lorem).
              • SplitFeature.text: 40–90 words specific to the feature (seasonal menu, chef story, sourcing).
              • ValueBadges: 3–6 concise badges (e.g., ‘Wood-Fired Oven’, ‘Gluten-Free Options’).
            - Images:
              • Use only direct HTTPS image URLs (images.unsplash.com or picsum.photos). No unsplash.com/photo pages.
              • Gallery must include ≥6 distinct photos with alt.
            - Tags:
              • Include "restaurant" on all restaurant-specific sections; add "general" where appropriate.
            - Links:
              • Use internal anchors consistently (#menu, #reservations).
            """

        # JSON schema for the model (expanded types)
        JSON_SCHEMA_TS = """
        type GeneratedSite = {
            success: true;
            websiteName: string;
            industry: string;
            style: string;
            tags: string[];
            components: Array<{
                id: string; // unique, kebab-case preferred (e.g., "hero-primary")
                type:
                  | "Header" | "Hero" | "FeatureGrid" | "Stats" | "Testimonials"
                  | "Pricing" | "FAQ" | "Contact" | "Footer" | "Gallery" | "Team"
                  | "Steps" | "BlogList" | "EventList" | "CourseList"
                  | "PropertyList" | "ProductGrid" | "CartSummary" | "CheckoutForm"
                  | "RestaurantMenu" | "ReservationForm" | "Hours" | "LocationMap"
                  | "SpecialsCarousel" | "PressLogos" | "AwardsBar" | "ChefBio"
                  | "DishGrid" | "BookingCTA" | "TestimonialHighlight" | "SocialStrip";
                tags?: string[]; // include the industry tag when relevant
                props: Record<string, any>;
            }>;
        };
        """

        # Prompt (note: templates are a JSON ARRAY)
        system_msg = "You are a website generator. Return ONLY valid JSON (no prose)."
        user_msg = f"""
Component templates (JSON array):
{templates}

User input:
- business_name: {payload.business_name}
- industry: {payload.industry}
- style: {payload.style}
- description: {payload.description}
- target_audience: {payload.target_audience or 'N/A'}
- business_goals: {payload.business_goals or 'N/A'}
- unique_selling_points: {payload.unique_selling_points or 'N/A'}

Rules:
- Use ONLY component types present in the templates and their propsSchema names.
- Output 7–10 components with a sensible landing-page order:
  1) Header, 2) Hero, 3) 1–3 value sections (FeatureGrid/Stats/Steps/Testimonials),
  4) 1 media/content section (Gallery or BlogList), 5) 1 conversion section (Pricing or Contact),
  6) Optional industry-specific section (e.g., ProductGrid for ecommerce, PropertyList for realestate, CourseList for education, EventList for events),
  7) Footer.
- Always include a Header and a Footer.
- At least ONE component must carry the industry tag "{payload.industry}" in its tags[].
- Each component must include: id (unique, kebab-case), type, tags[], and props that conform exactly to the template's propsSchema (matching prop names).
- If a propsSchema includes image fields, use full HTTPS image URLs from images.unsplash.com or picsum.photos. Do not use unsplash.com page links.
  - Provide descriptive alt text where the schema allows.
  - If Gallery is used, include >= 3 images.
- Prefer variety: don't repeat the same type more than once unless it's clearly beneficial (e.g., FeatureGrid + Stats is OK).
- Keep copy concise and production-ready. Avoid placeholder lorem ipsum.
{industry_rules}
- Make sure the result validates against this TypeScript shape. Do not wrap in markdown or add explanations.

Return ONLY JSON matching this TypeScript shape:
{JSON_SCHEMA_TS}
""".strip()

        model = make_model(system_msg)
        resp = model.generate_content(
            user_msg,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.45,
                "top_p": 0.9,
            },
        )

        # Parse model output
        try:
            raw_text = resp.text or "{}"
            try:
                with open("/tmp/backend.json", "w", encoding="utf-8") as f:
                    f.write(raw_text)
            except Exception:
                pass
            data = json.loads(raw_text)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Invalid JSON from model: {str(e)}")

        # ---- Auto-sanitize all image-like fields ----
        data = sanitize_images_in_obj(data)

        # Defaults
        data.setdefault("success", True)
        data.setdefault("websiteName", payload.business_name)
        data.setdefault("industry", payload.industry)
        data.setdefault("style", payload.style)
        data.setdefault("tags", [])
        for i, comp in enumerate(data.get("components", []) or []):
            comp.setdefault("id", f"c{i+1}")
            comp.setdefault("props", {})
            comp.setdefault("tags", [])

        return data

    except HTTPException:
        raise
    except Exception as e:
        return GenerateResponse(success=False, error=str(e))
