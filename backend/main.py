from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv
import os, json, re
import google.generativeai as genai
from urllib.parse import urlparse, urlunparse
import time
import pprint
from rag.vectorstore import retrieve_by_roles_payload

# 1) Load .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing. Put it in backend/.env")

# 2) Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

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

@app.get("/api/available-models")
def get_available_models():
    """List all available Gemini models"""
    try:
        models = genai.list_models()
        available_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                available_models.append({
                    'name': model.name,
                    'display_name': model.display_name,
                    'description': model.description,
                    'supported_methods': model.supported_generation_methods
                })
        return {"models": available_models}
    except Exception as e:
        return {"error": str(e), "available_models": []}
# Helper: build a model with a system instruction
def make_model(system_msg: str):
    try:
        return genai.GenerativeModel(GEMINI_MODEL, system_instruction=system_msg)
    except Exception as e:
        # Fallback to a known working model
        fallback_model = "models/gemini-2.0-flash-001"
        print(f"Warning: Model {GEMINI_MODEL} failed, falling back to {fallback_model}: {str(e)}")
        return genai.GenerativeModel(fallback_model, system_instruction=system_msg)
# -------- Image URL sanitizers (updated & hardened) --------
# -------- Image URL sanitizers (consolidated, hardened) --------
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
    host = (p.hostname or "").lower()
    if host == "plus.unsplash.com":
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
        or k.endswith(("img", "icon", "image", "src", "avatar", "background", "photo"))
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
                # For dynamic images (source.unsplash.com), preserve them
                if "source.unsplash.com" in v:
                    out[k] = v  # Keep dynamic URLs as-is
                else:
                    # Sanitize static images
                    u = _coerce_https(v)
                    u = _unsplash_page_to_direct(u)
                    u = _normalize_unsplash_hosts(u)
                    u = _normalize_unsplash_query(u)
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
        # --- RAG: composite query with role hints (dict payload) ---
        q_terms = [
            payload.industry or "",
            payload.style or "",
            (payload.description or "")[:240],
            payload.target_audience or "",
            payload.business_goals or "",
            payload.unique_selling_points or "",
        ]
        q_terms = [t for t in q_terms if t]

        role_hints = ["header", "hero", "value", "media", "social-proof", "conversion", "core-content", "footer", "aux"]

        rag_payload = retrieve_by_roles_payload(
            q_terms=q_terms,
            industry=payload.industry or "",
            style=payload.style or "",
            need_images=payload.images,
            role_hints=role_hints,
            k=10,  # wider candidate pool per role to enable richer pages
        ) or {}

        print("\n[DEBUG] Bucketed templates (first 1k chars):\n",
              json.dumps(rag_payload, ensure_ascii=False)[:1000], "...\n")

        # ----- Build allowed types from RAG payload -----
        templates = (rag_payload or {}).get("templates", []) or []
        retrieved_types = [t.get("type") for t in templates if t.get("type")]
        core_fallback = ["Header", "Hero", "Footer", "FAQ", "Testimonials", "Gallery", "Pricing", "Contact"]
        allowed_types = sorted(set(retrieved_types + core_fallback))
        allowed_types_union = " | ".join(f'"{t}"' for t in allowed_types) or '"Header" | "Hero" | "Footer"'

        # ---------- Industry-specific rules ----------
        industry_rules = ""
        industry_lower = (payload.industry or "").lower()

        if industry_lower in ["restaurant", "food", "restaurant & food"]:
            industry_rules = """
            Industry-specific requirements (Restaurant):
            - Output 10–12 components in this rough order:
              Header → Hero → AwardsBar/PressLogos → IntroSection → ValueBadges or Stats →
              RestaurantMenu (2–4 categories, 3–6 items each) → DishGrid or SpecialsCarousel →
              SplitFeature (e.g., 'Seasonal Menu'/'Private Dining') → ReservationForm or CTASection →
              Gallery (6–9 images) → Testimonials/TestimonialHighlight → FAQ → Hours → LocationMap → Footer.
            - Copy requirements:
              • IntroSection.text: 60–120 words describing cuisine, ambience, and USP (no lorem).
              • SplitFeature.text: 40–90 words specific to the feature (seasonal menu, chef story, sourcing).
              • ValueBadges: 3–6 concise badges (e.g., 'Wood-Fired Oven', 'Gluten-Free Options').
            - Images:
              • Use only direct HTTPS image URLs (images.unsplash.com or picsum.photos). No unsplash.com/photo pages.
              • Gallery must include ≥6 distinct photos with alt.
            - Tags:
              • Include "restaurant" on all restaurant-specific sections; add "general" where appropriate.
            - Links:
              • Use internal anchors consistently (#menu, #reservations).
            """
        elif industry_lower in ["technology", "software", "tech"]:
            industry_rules = """
                Industry-specific guidance (Technology/Software):

                Goals:
                - Produce a comprehensive, professional landing/marketing page with clear narrative flow.
                - Showcase value, proof, technical depth, and conversion paths without enforcing any fixed order.

                Composition (no strict order; arrange logically by story):
                - Required coverage:
                  • Header and Footer
                  • ≥1 value/benefit section (FeatureGrid, Stats, Steps, ValueBadges)
                  • ≥1 social proof section (Testimonials, CustomersLogos, SecurityBadges, ComplianceBadges, PressLogos)
                  • ≥1 media/content section (Gallery, BlogList/News, Changelog, SystemStatus)
                  • ≥1 core-content section that proves depth for technical buyers: APIEndpoints, InstallSteps, TutorialsList,
                    IntegrationGrid, UseCaseShowcase, SDKDownload, APIDocs, ArchitectureDiagram
                  • ≥1 conversion section (Pricing, DemoRequest, CTASection, Contact)

                Recommended components to choose from (pick what fits; no need to use all):
                  Header, Hero, FeatureGrid, Stats, Steps, UseCaseShowcase, CustomersLogos, SecurityBadges, ComplianceBadges,
                  IntegrationGrid, APIEndpoints, SDKDownload, InstallSteps, TutorialsList, APIDocs, ArchitectureDiagram,
                  Changelog, SystemStatus, Testimonials, Pricing, Team, BlogList, FAQ, CTASection, Contact, Footer.

                Copy & tone:
                - Hero headline ≤10 words; crisp and benefit-led.
                - Keep copy concrete and buyer-focused (what it does, why it matters, proof).
                - Name real technical artifacts (pipelines, runners, approvals, SDKs, OpenAPI, webhooks).
                - Avoid fluff and lorem; keep sentences concise.

                UX details:
                - Use internal anchors consistently (e.g., #features, #docs, #pricing, #demo).
                - CTA labels should be action-oriented (“Start free”, “Request a demo”, “View docs”).
                - If Pricing is irrelevant, use a clear conversion alternative (DemoRequest or CTASection).

                Imagery:
                - Use only direct HTTPS URLs (images.unsplash.com or picsum.photos).
                - Prefer tech-relevant visuals: dashboards, terminal/CLI, devices, code snippets, architecture diagrams.
                - Provide descriptive alt text.

                Data integrity:
                - Use only component types and prop keys that exist in the RAG templates (respect propsSchema/mustHave).
                - Prefer higher-scoring templates; do not repeat a type unless it adds new value.
                """

        elif industry_lower in ["healthcare", "medical"]:
            industry_rules = """
    Healthcare/Medical – guidance (no strict order):
    - Coverage:
      • Header & Footer
      • ≥1 value section (ServicesGrid, Stats, ValueBadges, TreatmentProcess)
      • ≥1 team/credibility section (DoctorCard/Team, CertificationsBadges, InsuranceAccepted)
      • ≥1 media/content section (Gallery, BlogList/News, TelehealthInfo)
      • ≥1 conversion (AppointmentScheduler, PatientPortalCTA, CTASection, Contact, LocationMap)
      • Optional: ConditionsTreated for depth; EmergencyNotice for safety.
    - Copy & tone:
      • Compassionate, professional, plain language. Avoid guarantees or unverified health claims.
      • Emphasize credentials, specialties, and access (same-day, telehealth).
    - Compliance:
      • Do not include medical advice; keep claims factual and generic.
    - Imagery:
      • Use HTTPS images with alt text. Prefer real clinic settings and friendly staff.
    """
        elif industry_lower in ["fitness", "wellness"]:
            industry_rules = """
    Fitness & Wellness – guidance (no strict order):
    - Coverage (aim for 14–22 sections total across the page):
      • Header & Footer
      • ≥2 value sections (FacilityAmenities, SuccessMetrics/Stats, FeatureGrid, TreatmentProcess)
      • ≥1 media section (EquipmentShowcase, Gallery, BlogList)
      • ≥1 core-content schedule/program section (ClassSchedule, ProgramList, TrainerProfiles, NutritionPlan)
      • ≥2 social-proof sections (BeforeAfter, ResultsTimeline, Testimonials)
      • ≥2 conversion sections (MembershipPlans, TrialPassCTA, Pricing, CTASection, Contact, ReservationForm)
    - Copy & tone:
      • Motivational but realistic. No exaggerated health/weight-loss claims.
      • Emphasize coaching quality, community, and safety.
    - Imagery:
      • Use HTTPS images; prefer real gym spaces, people training, or calm studio shots.
    - Compliance:
      • Avoid medical claims. Keep any nutrition guidance general.
    """
        elif industry_lower in ["beauty", "spa"]:
            industry_rules = """
    Beauty & Spa – guidance (no strict order):
    - Aim for ~12–18 sections across the page:
      • Header & Footer
      • ≥2 service/value sections (ServiceMenu, SpaAmenities, SpecialPackages, FeatureGrid)
      • ≥2 media sections (Gallery, ProductSpotlight)
      • ≥2 social-proof sections (Testimonials, TestimonialHighlight)
      • ≥2 conversion CTAs (GiftCardGrid, SpaCTA, Pricing, ReservationForm)
    - Copy:
      • Relaxing, luxurious, wellness-focused tone.
      • Avoid exaggerated or medical claims.
    - Imagery:
      • HTTPS images only (Unsplash/Picsum).
      • Spa interiors, treatments, products, calm lifestyle.
    - Compliance:
      • No medical promises, just wellness/relaxation benefits.
    """
        elif industry_lower in ["legal", "law firm"]:
            industry_rules = """
            Industry-specific requirements (Legal/Law Firm):
            - Output 7–10 components in this order:
              Header → Hero → PracticeAreas → AttorneyProfiles → CaseResults →
              Testimonials → ConsultationForm → FAQ → Footer.
            - Copy requirements:
              • Use professional, authoritative language.
              • Highlight experience, wins, and credentials.
              • Avoid guaranteeing specific outcomes.
            - Images:
              • Use professional headshots for attorneys.
              • Courtroom or office images should look authentic.
            - Tags:
              • Include "legal" or "law" tags where relevant.
            - Compliance:
              • Include required disclaimers if needed.
            """
        elif industry_lower in ["real estate"]:
            industry_rules = """
            Industry-specific requirements (Real Estate):
            - Output 9–12 components in this order:
              Header → Hero → SearchWidget → FeaturedListings → NeighborhoodGuide →
              Testimonials → AgentProfiles → Contact → FAQ → Footer.
            - Copy requirements:
              • Highlight local market knowledge.
              • Include clear contact methods.
              • Show recent sales/transactions if available.
            - Images:
              • High-quality property photos are essential.
              • Include neighborhood shots and amenities.
            - Tags:
              • Include "real-estate" tags where relevant.
            """
        elif industry_lower in ["education", "training"]:
            industry_rules = """
            Industry-specific requirements (Education/Training):
            - Output 8–11 components in this order:
              Header → Hero → ProgramOverview → Curriculum → InstructorProfiles →
              Testimonials → Pricing → Schedule → Contact → FAQ → Footer.
            - Copy requirements:
              • Highlight learning outcomes and benefits.
              • Include accreditation if applicable.
              • Show success metrics (graduation rates, etc.).
            - Images:
              • Show learning environments and happy students.
              • Include logos of accrediting bodies if relevant.
            - Tags:
              • Include "education" or "training" tags where relevant.
            """
        elif industry_lower in ["photography", "creative"]:
            industry_rules = """
            Industry-specific requirements (Photography/Creative):
            - Output 7–9 components in this order:
              Header → Hero → PortfolioGallery → Services → Pricing →
              Testimonials → About → Contact → Footer.
            - Copy requirements:
              • Show artistic style and unique perspective.
              • Include equipment/special techniques if relevant.
            - Images:
              • Portfolio images must be high-quality examples.
              • Show your best work first.
            - Tags:
              • Include "photography" or "creative" tags where relevant.
            """
        elif industry_lower in ["business consulting"]:
            industry_rules = """
            Industry-specific requirements (Business Consulting):
            - Output 7–10 components in this order:
              Header → Hero → Services → CaseStudies → Testimonials →
              Team → Contact → BlogList → Footer.
            - Copy requirements:
              • Highlight specific industries/expertise.
              • Show measurable results for clients.
              • Include credentials/certifications.
            - Images:
              • Professional headshots for consultants.
              • Business/office environment images.
            - Tags:
              • Include "consulting" tags where relevant.
            """
        elif industry_lower in ["e-commerce", "retail"]:
            industry_rules = """
            Industry-specific requirements (E-commerce/Retail):
            - Output 9–12 components in this order:
              Header → Hero → ProductCategories → FeaturedProducts → Testimonials →
              SpecialOffers → AboutBrand → ShippingInfo → FAQ → Footer.
            - Copy requirements:
              • Clear product descriptions with benefits.
              • Highlight unique selling points.
              • Include shipping/return policies.
            - Images:
              • High-quality product photos from multiple angles.
              • Lifestyle images showing products in use.
            - Tags:
              • Include "ecommerce" or "retail" tags where relevant.
            """
        elif industry_lower in ["travel", "tourism"]:
            industry_rules = """
            Industry-specific requirements (Travel/Tourism):
            - Output 8–11 components in this order:
              Header → Hero → DestinationHighlights → Packages → Testimonials →
              Gallery → BookingWidget → FAQ → Contact → Footer.
            - Copy requirements:
              • Create a sense of adventure and relaxation.
              • Highlight unique experiences.
              • Include practical travel information.
            - Images:
              • Stunning destination photos.
              • Show happy travelers if possible.
            - Tags:
              • Include "travel" or "tourism" tags where relevant.
            """
        elif industry_lower in ["construction", "architecture"]:
            industry_rules = """
            Industry-specific requirements (Construction/Architecture):
            - Output 8–11 components in this order:
              Header → Hero → Services → ProjectPortfolio → ProcessSteps →
              Testimonials → Team → Contact → FAQ → Footer.
            - Copy requirements:
              • Highlight expertise and past projects.
              • Explain your process clearly.
              • Include safety certifications if relevant.
            - Images:
              • High-quality project photos (before/after if possible).
              • Show team in action.
            - Tags:
              • Include "construction" or "architecture" tags where relevant.
            """
        elif industry_lower in ["automotive", "transportation"]:
            industry_rules = """
            Industry-specific requirements (Automotive/Transportation):
            - Output 8–11 components in this order:
              Header → Hero → InventoryList → Services → Testimonials →
              FinancingOptions → LocationMap → Contact → FAQ → Footer.
            - Copy requirements:
              • Highlight vehicle features and benefits.
              • Include financing/special offers.
              • Show service department capabilities.
            - Images:
              • High-quality vehicle photos.
              • Show facility/service bay if relevant.
            - Tags:
              • Include "automotive" tags where relevant.
            """
        elif industry_lower in ["fashion", "apparel"]:
            industry_rules = """
            Industry-specific requirements (Fashion/Apparel):
            - Output 8–10 components in this order:
              Header → Hero → Lookbook → ProductGrid → AboutDesigner →
              Testimonials → SizeGuide → Contact → Footer.
            - Copy requirements:
              • Highlight design philosophy and materials.
              • Include sizing/fit information.
              • Show styling suggestions.
            - Images:
              • Professional product shots on models.
              • Detail shots of fabrics/construction.
            - Tags:
              • Include "fashion" tags where relevant.
            """
        elif industry_lower in ["finance", "banking"]:
            industry_rules = """
            Industry-specific requirements (Finance/Banking):
            - Output 7–10 components in this order:
              Header → Hero → Services → Rates → Testimonials →
              Team → Contact → FAQ → Footer.
            - Copy requirements:
              • Use trustworthy, professional language.
              • Highlight security measures.
              • Include clear rate information.
            - Images:
              • Professional headshots for advisors.
              • Office/facility images.
            - Tags:
              • Include "finance" tags where relevant.
            - Compliance:
              • Include required financial disclaimers.
            """
        elif industry_lower in ["non-profit", "charity"]:
            industry_rules = """
            Industry-specific requirements (Non-profit/Charity):
            - Output 8–11 components in this order:
              Header → Hero → MissionStatement → Programs → ImpactStats →
              DonationWidget → VolunteerForm → Events → FAQ → Footer.
            - Copy requirements:
              • Focus on mission and impact.
              • Show transparency in fund usage.
              • Include clear donation options.
            - Images:
              • Show beneficiaries and programs in action.
              • Avoid overly sad imagery; focus on hope.
            - Tags:
              • Include "nonprofit" tags where relevant.
            """
        elif industry_lower in ["event planning"]:
            industry_rules = """
            Industry-specific requirements (Event Planning):
            - Output 8–11 components in this order:
              Header → Hero → Services → Portfolio → Testimonials →
              Process → Contact → FAQ → Footer.
            - Copy requirements:
              • Highlight past successful events.
              • Explain your planning process.
              • Include vendor relationships if relevant.
            - Images:
              • Show beautifully executed events.
              • Include diverse event types if applicable.
            - Tags:
              • Include "events" tags where relevant.
            """
        elif industry_lower in ["interior design"]:
            industry_rules = """
            Industry-specific requirements (Interior Design):
            - Output 8–10 components in this order:
              Header → Hero → Portfolio → Services → Process →
              Testimonials → Contact → FAQ → Footer.
            - Copy requirements:
              • Highlight design style and philosophy.
              • Show before/after when possible.
              • Include product sourcing if relevant.
            - Images:
              • High-quality portfolio shots.
              • Show different styles if versatile.
            - Tags:
              • Include "design" tags where relevant.
            """
        elif industry_lower in ["marketing", "advertising"]:
            industry_rules = """
            Industry-specific requirements (Marketing/Advertising):
            - Output 8–11 components in this order:
              Header → Hero → Services → CaseStudies → Testimonials →
              Team → Blog → Contact → Footer.
            - Copy requirements:
              • Highlight measurable results for clients.
              • Show creative approach.
              • Include client industries served.
            - Images:
              • Show campaigns/work samples.
              • Professional team photos.
            - Tags:
              • Include "marketing" tags where relevant.
            """

        # JSON schema for the model (expanded types)
        JSON_SCHEMA_TS = f"""
        type GeneratedSite = {{
          success: true;
          websiteName: string;
          industry: string;
          style: string;
          tags: string[];
          components: Array<{{
            id: string;
            type: {allowed_types_union};
            tags?: string[];
            props: Record<string, any>;
          }}>;
        }};
        """

        # Prompt (note: templates are a JSON ARRAY)
        # you already produced: templates_obj (a dict) from the retriever
        # make the shortlist the default source for components in the prompt
        system_msg = (
            "You are a senior UX writer + information architect who outputs ONLY valid JSON (no prose). "
            "Strictly use component props keys that exist in the provided propsSchema; do not invent keys. "
            "Write specific, production-ready copy; no lorem ipsum."
        )
        user_msg = f"""
        RAG payload (templates, image_keywords, schema_defaults):
        {json.dumps(rag_payload, ensure_ascii=False)}

        User input:
        - business_name: {payload.business_name}
        - industry: {payload.industry}
        - style: {payload.style}
        - description: {payload.description}
        - target_audience: {payload.target_audience or 'N/A'}
        - business_goals: {payload.business_goals or 'N/A'}
        - unique_selling_points: {payload.unique_selling_points or 'N/A'}
        
        Policy:
        - Allowed component types come from the RAG templates: {", ".join(allowed_types)}.
        - For every component you output, props MUST stick to that component's propsSchema (see templates[*].propsSchemaKeys).
        - When a prop is missing but has a default in schema_defaults, fill it sensibly. Do not add new keys.
        - Prefer templates with higher templates[*]._score and avoid duplicate types unless they add new value (secondary CTA later is OK).
        - No fixed order; arrange sections logically for a compelling narrative.
        
        Quality targets:
        - Output a full, professional page with ~14–22 components (use fewer only if the story is already complete).
        - Must include Header and Footer (if allowed).
        - Aim for breadth and depth:
            • ≥2 conversion sections (e.g., Pricing, ReservationForm/Contact, CTASection, BookingCTA, DemoRequest)
            • ≥2 social-proof sections (e.g., Testimonials, TestimonialHighlight, AwardsBar, PressLogos)
            • ≥2 media/content sections (e.g., Gallery with 9–12 images, BlogList/News, ProductCarousel/Changelog)
            • ≥1–3 core-content sections relevant to the industry (e.g., RestaurantMenu; IntegrationGrid/APIDocs/APIEndpoints for software)
        - Navigation must be coherent: if you output internal links, those anchors should exist (#features, #menu, #pricing, #gallery, #docs, #contact).
        - Copy should be specific to the business; keep it concise and benefit-led; avoid generic claims.
        
        Images:
        - Use only HTTPS URLs with descriptive alt text.
        - Choose visuals aligned with these keywords:
        {", ".join((rag_payload.get("image_keywords") or []))}
        Industry amplification (optional if matched):
        {(industry_rules or "N/A").strip()}



        Output:
        Return ONLY JSON matching this TypeScript type:
        {JSON_SCHEMA_TS}
        """
        try:
            model = make_model(system_msg)
            resp = model.generate_content(
                user_msg,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.5,
                    "top_p": 0.9,
                    "max_output_tokens": 12288,
                },
            )
        except Exception as model_error:
            # Try with a fallback model
            print(f"Model error with {GEMINI_MODEL}, trying fallback: {str(model_error)}")
            fallback_model = genai.GenerativeModel("models/gemini-2.0-flash-001", system_instruction=system_msg)
            resp = fallback_model.generate_content(
                user_msg,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.5,
                    "top_p": 0.9,
                    "max_output_tokens": 12288,
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
            comp.setdefault("id", f"c{i + 1}")
            comp.setdefault("props", {})
            comp.setdefault("tags", [])

        return data

    except HTTPException:
        raise
    except Exception as e:
        return GenerateResponse(success=False, error=str(e))


# Page role ordering used throughout
ORDER = ["header","hero","value","media","social-proof","conversion","core-content","footer","aux"]

# Type buckets used to summarize coverage
CONVERSION_TYPES = {
    "Contact","ReservationForm","BookingCTA","CheckoutForm","Pricing",
    "DemoRequest","ServiceTiers","DonationTiers","MortgageCalculator",
    "RetirementCalculator","PatientPortalCTA","CTASection","ServicePackages",
}
SOCIAL_TYPES = {
    "Testimonials","TestimonialHighlight","AwardsBar","PressLogos",
    "CaseResults","ResultsTimeline","ImpactMeter",
}
MEDIA_TYPES = {
    "Gallery","BlogList","ProductCarousel","LookbookGallery","DestinationGrid",
    "ClientPortfolio","DishGrid","EventList","CourseList","CourseSyllabus",
    "PropertyList","VenueShowcase","MaterialShowcase",
}

# If your generator doesn’t always set pageRole, we can infer from type
_TYPE_ROLE_HINTS = {
    # layout
    "Header":"header","Footer":"footer","Hero":"hero",
    # value/benefit
    "FeatureGrid":"value","Stats":"value","Steps":"value","ValueBadges":"value",
    # media/content
    "Gallery":"media","BlogList":"media","ProductCarousel":"media","LookbookGallery":"media",
    "DestinationGrid":"media","ClientPortfolio":"media","DishGrid":"media","EventList":"media",
    "CourseList":"media","CourseSyllabus":"media","PropertyList":"media","VenueShowcase":"media",
    "MaterialShowcase":"media",
    # social proof
    "Testimonials":"social-proof","TestimonialHighlight":"social-proof",
    "AwardsBar":"social-proof","PressLogos":"social-proof","CaseResults":"social-proof",
    "ResultsTimeline":"social-proof","ImpactMeter":"social-proof",
    # conversion
    "Contact":"conversion","ReservationForm":"conversion","BookingCTA":"conversion",
    "CheckoutForm":"conversion","Pricing":"conversion","DemoRequest":"conversion",
    "ServiceTiers":"conversion","DonationTiers":"conversion","MortgageCalculator":"conversion",
    "RetirementCalculator":"conversion","PatientPortalCTA":"conversion","CTASection":"conversion",
    "ServicePackages":"conversion",
    # core-content (industry-specific deep content)
    "RestaurantMenu":"core-content","APIDocs":"core-content","IntegrationGrid":"core-content",
    "PracticeAreas":"core-content","AttorneyProfile":"core-content","DoctorCard":"core-content",
    "ClassSchedule":"core-content","TrainerProfiles":"core-content","NutritionPlan":"core-content",
    "ServiceMenu":"core-content","ProductSpotlight":"core-content","PropertySearch":"core-content",
    "NeighborhoodGuide":"core-content","CurriculumAccordion":"core-content","InstructorHighlight":"core-content",
    "LearningPath":"core-content","ProjectTimeline":"core-content","VehicleComparison":"core-content",
    "RateTable":"core-content","StyleQuiz":"core-content","RoomVisualizer":"core-content",
    "ServiceProcess":"core-content","CodeSample":"core-content",
    # aux
    "IntroSection":"aux","SplitFeature":"aux","NewsletterSignup":"aux","Divider":"aux",
    "PrivateDining":"aux","Catering":"aux","WineListHighlight":"aux","MapList":"aux",
    "SpecialsCarousel":"aux","Hours":"aux","LocationMap":"aux","Team":"aux","JobList":"aux",
    "PropertyMap":"aux","ItineraryDay":"aux","SeasonalPromo":"aux","TelehealthInfo":"aux",
}
def _gather_image_keywords(components: list[dict], industry: str = "") -> list[str]:
    """
    Collect imageKeywords from selected components with industry enhancement
    """
    kws = []
    for c in components or []:
        kws.extend(c.get("imageKeywords") or [])

    # Add industry-specific keywords
    industry_enhancements = {
        "restaurant": ["food", "restaurant", "cuisine", "chef", "dining"],
        "technology": ["technology", "software", "computer", "code", "digital"],
        "healthcare": ["healthcare", "medical", "doctor", "hospital", "wellness"],
        "beauty": ["beauty", "spa", "skincare", "relaxation", "wellness"],
        "fitness": ["fitness", "gym", "workout", "health", "exercise"],
        # Add more industry mappings
    }

    if industry.lower() in industry_enhancements:
        kws.extend(industry_enhancements[industry.lower()])

    # de-dupe and keep it compact
    out = []
    seen = set()
    for w in kws:
        key = str(w).strip().lower()
        if key and key not in seen:
            out.append(str(w).strip())
            seen.add(key)
    return out[:24]  # cap a bit
def _role_of(comp: dict) -> str:
    # prefer explicit pageRole, else infer by type
    return (comp.get("pageRole")
            or _TYPE_ROLE_HINTS.get(comp.get("type",""), "aux"))

def _has_role(components: list[dict], role: str) -> bool:
    return any(_role_of(c) == role for c in components)

def _has_any_type(components: list[dict], type_set: set[str]) -> bool:
    return any((c.get("type") or "") in type_set for c in components)

def summarize_coverage(components: list[dict]) -> dict:
    by_role = {}
    for c in components:
        r = _role_of(c)
        by_role.setdefault(r, 0)
        by_role[r] += 1

    has_conversion = _has_any_type(components, CONVERSION_TYPES)
    has_social = _has_any_type(components, SOCIAL_TYPES)
    has_media = _has_any_type(components, MEDIA_TYPES)

    return {
        "by_role": by_role,
        "has_header": _has_role(components, "header"),
        "has_footer": _has_role(components, "footer"),
        "has_conversion": has_conversion,
        "has_social_proof": has_social,
        "has_media": has_media,
        "missing": [
            r for r, ok in [
                ("header", _has_role(components, "header")),
                ("footer", _has_role(components, "footer")),
                ("conversion", has_conversion),
                ("social-proof", has_social),
                ("media", has_media),
            ] if not ok
        ],
    }

def log_retrieval_debug(q_terms, role_map, initial, balanced):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    coverage_init = summarize_coverage(initial)
    coverage_final = summarize_coverage(balanced)

    info = {
        "ts": ts,
        "query_terms": [t for t in q_terms if t],
        "retrieved_roles": {r: [t.get("id") or t.get("type") for t in role_map.get(r, [])] for r in ORDER},
        "initial_pick_ids": [c.get("id") or c.get("type") for c in initial],
        "balanced_ids": [c.get("id") or c.get("type") for c in balanced],
        "coverage_initial": coverage_init,
        "coverage_final": coverage_final,
    }
    print("\n[RETRIEVAL DEBUG]")
    pprint.pprint(info, width=120)
