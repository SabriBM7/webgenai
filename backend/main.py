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
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
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
# Add this function right after the imports and before the main endpoint
def get_flexible_industry_guidance(industry_lower: str) -> str:
    """
    Return flexible, non-restrictive industry guidance that encourages natural narrative flow
    """
    guidance_templates = {
        "restaurant": """
        RESTAURANT & FOOD INDUSTRY - Professional Website Guidance
        
        Overall Approach:
        Create a compelling culinary journey that makes visitors hungry for the experience.
        Focus on storytelling through food, ambiance, and service excellence.
        
        Key Narrative Elements to Consider Naturally:
        • First Impressions: Strong visual identity showcasing restaurant atmosphere and cuisine style
        • Credibility Building: Awards, chef credentials, press features, or unique selling points
        • Culinary Experience: Menu highlights, special dishes, chef's philosophy, ingredient sourcing
        • Visual Journey: Restaurant ambiance, food photography, behind-the-scenes moments
        • Social Proof: Customer experiences, reviews, regular patron stories
        • Practical Information: Location, hours, reservation process, contact details
        • Conversion Opportunities: Multiple reservation points, special offers, event bookings
        
        Natural Flow Ideas (not prescriptive):
        Consider starting with atmosphere, building desire with food storytelling, 
        establishing trust through social proof, and making conversion easy.
        
        Content Principles:
        • Use sensory language that evokes taste, aroma, and dining experience
        • Highlight what makes the restaurant unique (cuisine style, chef story, local sourcing)
        • Include practical information naturally within the narrative flow
        • Create multiple natural conversion opportunities
        • Show, don't just tell - use high-quality food and ambiance photography
        
        Professional Standards:
        • All imagery should be high-quality, professionally styled food and restaurant photography
        • Copy should be specific to the actual cuisine and dining experience
        • Maintain consistent tone that matches the restaurant's style (casual, fine dining, etc.)
        • Ensure all practical information is clear and accessible
        """,

        "technology": """
        TECHNOLOGY & SOFTWARE INDUSTRY - Professional Website Guidance

        Overall Approach:
        Build trust through clear value proposition, technical credibility, and proven results.

        Key Narrative Elements to Consider Naturally:
        • Problem & Solution: Clearly articulate the pain points and how your technology solves them
        • Technical Depth: Show appropriate level of technical sophistication for the target audience
        • Credibility Signals: Case studies, security certifications, customer logos, performance metrics
        • Product Demonstration: Clear explanation of features, integrations, and user benefits
        • Conversion Pathways: Free trials, demos, documentation access, pricing transparency

        Natural Flow Ideas (not prescriptive):
        Consider starting with the core value proposition, demonstrating technical capabilities,
        building trust through social proof, and providing clear next steps for evaluation.

        Essential Components for Technology Websites:
        • Clear value proposition and problem/solution framing
        • Feature demonstrations with concrete benefits
        • Technical specifications and capabilities
        • Integration ecosystem and API documentation
        • Security and compliance certifications
        • Customer success stories and case studies
        • Transparent pricing and trial options
        • Developer resources and SDK availability

        Content Principles:
        • Focus on outcomes and benefits, not just features
        • Use concrete metrics and performance data where possible
        • Balance technical depth with accessibility for decision-makers
        • Include specific integration examples and use cases
        • Highlight security and reliability for enterprise buyers

        Professional Standards:
        • All technical claims should be verifiable and specific
        • Include real customer examples and results
        • Provide clear paths for both technical and business evaluation
        • Maintain consistent technical accuracy throughout
        • Ensure all conversion points are clear and accessible
        """,
        "fitness": """
        FITNESS & WELLNESS INDUSTRY - Professional Website Guidance

        Overall Approach:
        Inspire transformation through community, expertise, and proven results.

        Key Narrative Elements to Consider Naturally:
        • Transformation Stories: Real member results and success journeys
        • Expert Credibility: Certified trainers, professional facilities, proven methodologies
        • Community Atmosphere: Supportive environment, group energy, social proof
        • Comprehensive Offerings: Classes, personal training, nutrition, recovery services
        • Accessible Entry Points: Free trials, introductory offers, flexible memberships

        Natural Flow Ideas (not prescriptive):
        Consider starting with inspirational transformations, showcasing expert trainers and facilities,
        demonstrating the variety of programs, highlighting community success, and making membership accessible.

        Essential Components for Fitness Websites:
        • Inspirational member transformations and results
        • Professional trainer profiles with certifications
        • Comprehensive class schedules and program offerings
        • State-of-the-art facility and equipment showcase
        • Nutrition and wellness service integration
        • Transparent membership options and pricing
        • Community testimonials and social proof
        • Easy trial and onboarding processes

        Content Principles:
        • Focus on outcomes and lifestyle benefits, not just workouts
        • Use real member stories and specific results
        • Balance motivation with professional credibility
        • Highlight the community and support system
        • Make fitness accessible and non-intimidating

        Professional Standards:
        • All fitness claims should be realistic and achievable
        • Include proper certifications and trainer qualifications
        • Show real facilities and equipment (no stock photos if possible)
        • Provide clear pricing without hidden fees
        • Emphasize safety and proper technique
        • Include appropriate disclaimers for health and fitness
        """,

        "beauty": """
        BEAUTY & SPA INDUSTRY - Professional Website Guidance

        Overall Approach:
        Create an atmosphere of luxury, relaxation, and transformation that appeals to self-care and wellness.

        Key Narrative Elements to Consider Naturally:
        • Sensory Experience: Evoke feelings of relaxation, luxury, and transformation
        • Expertise & Trust: Highlight professional credentials, certifications, and experience
        • Results & Benefits: Showcase tangible outcomes and wellness benefits
        • Luxury & Quality: Emphasize premium products, facilities, and experiences
        • Accessibility: Make booking and information easily accessible

        Natural Flow Ideas (not prescriptive):
        Consider starting with an inviting atmosphere, showcasing services and expertise,
        building trust through results and testimonials, and making booking effortless.

        Essential Components for Beauty & Spa Websites:
        • Comprehensive service menus with clear pricing
        • Professional team profiles with credentials
        • Treatment results and transformations
        • Luxury facility amenities
        • Retail product offerings
        • Special packages and promotions
        • Client testimonials and reviews
        • Easy booking and gift options

        Content Principles:
        • Use sensory language that evokes relaxation and luxury
        • Focus on benefits and outcomes, not just services
        • Highlight expertise and professional qualifications
        • Include specific product brands and ingredients
        • Show real results with before/after when appropriate

        Professional Standards:
        • Maintain a consistent luxury aesthetic throughout
        • Use high-quality, professional photography
        • Include clear pricing and service durations
        • Highlight safety, hygiene, and professional standards
        • Provide multiple booking and contact options

        Visual & Tone Guidelines:
        • Soft, calming color palettes
        • Elegant, clean typography
        • Professional before/after photography
        • Luxury product imagery
        • Serene spa environment shots
        """,
        "ecommerce": """
        E-COMMERCE & RETAIL INDUSTRY - Professional Website Guidance

        Overall Approach:
        Create a compelling shopping experience that builds trust, showcases products effectively, and drives conversions.

        Key Narrative Elements to Consider Naturally:
        • Product Discovery: Easy navigation and product discovery through categories and search
        • Visual Merchandising: High-quality product imagery and compelling presentation
        • Trust Building: Customer reviews, security badges, return policies, shipping transparency
        • Value Proposition: Clear pricing, promotions, and unique selling points
        • Conversion Optimization: Streamlined checkout process and multiple payment options

        Natural Flow Ideas (not prescriptive):
        Consider starting with hero promotions, showcasing featured products, building trust through social proof, 
        providing essential shopping information, and making purchase decisions easy and secure.

        Essential Components for E-commerce Websites:
        • Clear product categorization and navigation
        • High-quality product imagery with multiple angles
        • Customer reviews and rating systems
        • Transparent pricing and promotion displays
        • Shipping and return policy information
        • Security badges and trust signals
        • Shopping cart and checkout process features
        • Mobile-responsive product displays

        Content Principles:
        • Use compelling product descriptions with benefits and features
        • Include social proof through reviews and ratings
        • Be transparent about pricing, shipping costs, and policies
        • Highlight promotions and limited-time offers clearly
        • Provide detailed product information and specifications

        Professional Standards:
        • All product images should be high-quality and consistent
        • Pricing information must be clear and transparent
        • Shipping costs and delivery times should be prominently displayed
        • Return policies and guarantees should be easy to find
        • Security and payment trust badges should be visible
        """,
        "healthcare": """
        HEALTHCARE & MEDICAL INDUSTRY - Professional Website Guidance

        Overall Approach:
        Build trust through compassion, expertise, and clear patient-focused communication.

        Key Narrative Elements to Consider Naturally:
        • Compassionate Introduction: Understanding patient concerns and healthcare needs
        • Professional Credentials: Expertise, qualifications, and medical experience
        • Service Clarity: Clear explanation of treatments, procedures, and approaches
        • Patient Experience: What to expect, process transparency, and care philosophy
        • Trust Building: Patient stories, success outcomes, facility quality, staff credentials
        • Accessibility: Easy appointment scheduling, location information, insurance details

        Natural Flow Ideas (not prescriptive):
        Consider starting with compassionate understanding of patient needs, establishing medical credibility,
        clearly explaining services and approach, building trust through patient experiences, and making
        care accessible through clear next steps.

        Essential Components for Healthcare Websites:
        • Clear service offerings with medical accuracy
        • Professional medical team profiles with credentials
        • Easy appointment scheduling and contact information
        • Insurance and payment options transparency
        • Patient portal access and digital health tools
        • Telehealth and virtual care availability
        • Patient education and health resources
        • Emergency and after-hours information

        Content Principles:
        • Use compassionate, reassuring, and professional language
        • Highlight medical expertise and credentials naturally
        • Maintain appropriate medical discretion and HIPAA compliance
        • Focus on patient outcomes and quality of life improvements
        • Include clear calls to action for appointments and information
        • Balance medical accuracy with patient-friendly explanations

        Professional Standards:
        • All medical information should be accurate and evidence-based
        • Include proper disclaimers for medical content
        • Maintain patient privacy and confidentiality in all content
        • Ensure accessibility for patients with different health literacy levels
        • Provide clear emergency and urgent care instructions
        • Include proper credentials and certifications

        Compliance Considerations:
        • Avoid making specific medical outcome guarantees
        • Include appropriate medical disclaimers where needed
        • Ensure all provider credentials are accurately represented
        • Maintain HIPAA compliance in all patient-facing content
        • Provide clear scope of practice information
        """
    }

    # Default guidance for any industry
    default_guidance = """
    PROFESSIONAL BUSINESS WEBSITE - General Guidance
    
    Overall Approach:
    Create a compelling narrative that builds trust and drives action.
    
    Key Narrative Elements:
    • Strong value proposition and unique selling points
    • Credibility building through expertise and social proof
    • Clear explanation of products/services and benefits
    • Multiple natural conversion opportunities
    • Professional presentation and user experience
    
    Content Principles:
    • Write specific, benefit-focused copy
    • Use high-quality, relevant imagery
    • Create logical information hierarchy
    • Maintain consistent brand voice
    • Ensure clear calls to action throughout
    """

    return guidance_templates.get(industry_lower, default_guidance)
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
        print(f"\n🎯 GENERATING FOR: {payload.business_name} ({payload.industry})")
        print("📊 RETRIEVED COMPONENTS:")
        templates = rag_payload.get("templates", [])
        for i, template in enumerate(templates):
            score = template.get('_score', 0)
            role = template.get('_role', 'unknown')
            print(f"  {i+1}. {template.get('type')} | Role: {role} | Score: {score:.3f}")
            
        print("\n[DEBUG] Bucketed templates (first 1k chars):\n",
              json.dumps(rag_payload, ensure_ascii=False)[:1000], "...\n")

        # ----- Build allowed types from RAG payload -----
        templates = (rag_payload or {}).get("templates", []) or []
        retrieved_types = [t.get("type") for t in templates if t.get("type")]
        core_fallback = ["Header", "Hero", "Footer", "FAQ", "Testimonials", "Gallery", "Pricing", "Contact"]
        allowed_types = sorted(set(retrieved_types + core_fallback))
        allowed_types_union = " | ".join(f'"{t}"' for t in allowed_types) or '"Header" | "Hero" | "Footer"'

        # ---------- Industry-specific rules ----------
        industry_lower = (payload.industry or "").lower()
        industry_guidance = get_flexible_industry_guidance(industry_lower)

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
        RAG CONTEXT & COMPONENT LIBRARY:
        {json.dumps(rag_payload, ensure_ascii=False)}

        BUSINESS REQUIREMENTS:
        - Business Name: {payload.business_name}
        - Industry: {payload.industry}
        - Design Style: {payload.style}
        - Business Description: {payload.description}
        - Target Audience: {payload.target_audience or 'General audience'}
        - Business Goals: {payload.business_goals or 'Increase visibility and engagement'}
        - Unique Selling Points: {payload.unique_selling_points or 'Quality and service excellence'}

        COMPONENT CONSTRAINTS:
        - Allowed component types: {", ".join(allowed_types)}
        - For each component, props MUST follow the provided propsSchema
        - Use schema_defaults as guidance for expected data structure
        - Prefer higher-scoring templates from RAG results

        PROFESSIONAL WEBSITE STANDARDS:

        COMPREHENSIVE COVERAGE:
        Create a complete, professional website with natural narrative flow. Include:
        • Strong opening that establishes brand identity and value
        • Multiple sections that build credibility and trust
        • Rich content that showcases products/services naturally
        • Social proof and validation elements
        • Clear conversion pathways
        • Professional footer with essential information

        NATURAL NARRATIVE FLOW:
        Arrange components in a logical, compelling sequence that tells a story. Consider:
        1. Introduction & Value Proposition
        2. Credibility & Trust Building  
        3. Product/Service Showcase
        4. Social Proof & Validation
        5. Conversion & Action
        6. Practical Information

        CONTENT QUALITY:
        • Write specific, production-ready copy tailored to the business
        • Avoid generic placeholder text - be concrete and descriptive
        • Use appropriate tone for the industry and audience
        • Create compelling headlines and benefit-focused descriptions
        • Ensure all copy serves a purpose in the overall narrative

        IMAGERY & VISUALS:
        • Use high-quality, contextually appropriate images
        • Generate images using these keyword themes: {", ".join((rag_payload.get("image_keywords") or []))}
        • All images must be HTTPS URLs from approved sources
        • Include descriptive alt text for accessibility
        • Ensure visual consistency throughout

        INDUSTRY-SPECIFIC GUIDANCE:
        {industry_guidance}

        NAVIGATION & UX:
        • Create coherent internal navigation with logical anchor links
        • Include multiple conversion opportunities throughout the page
        • Ensure mobile-friendly component arrangement
        • Maintain consistent styling and spacing

        TECHNICAL REQUIREMENTS:
        • Output must be valid JSON matching the specified schema
        • All component types must exist in allowed_types list
        • All props must conform to their component's propsSchema
        • Include appropriate tags for categorization
        • Ensure all required fields (mustHave) are populated

        OUTPUT STRUCTURE:
        Generate a complete website with 12-20 components that tells a compelling story and drives action. 
        The arrangement should feel natural and professional, not forced or template-driven.

        Return ONLY valid JSON matching this schema:
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
        # Also extract keywords from component content
        if c.get('props'):
            # Look for text fields that might contain relevant keywords
            text_fields = ['title', 'heading', 'description', 'text', 'name']
            for field in text_fields:
                if field in c['props'] and c['props'][field]:
                    words = re.findall(r'\b[a-z]{3,15}\b', c['props'][field].lower())
                    kws.extend(words[:2])  # Add a couple of content keywords

    # Enhanced industry-specific keywords
    industry_enhancements = {
        "restaurant": ["restaurant", "food", "cuisine", "chef", "dining", "meal", "culinary", "gourmet"],
        "technology": ["technology", "software", "computer", "code", "digital", "innovation", "tech", "data"],
        "healthcare": ["healthcare", "medical", "doctor", "hospital", "wellness", "health", "care", "clinic"],
        "beauty": ["beauty", "spa", "skincare", "relaxation", "wellness", "treatment", "salon", "cosmetic"],
        "fitness": ["fitness", "gym", "workout", "health", "exercise", "training", "sports", "active"],
        "ecommerce": ["shopping", "retail", "products", "online", "store", "buy", "purchase", "delivery"],
        "education": ["education", "learning", "school", "students", "knowledge", "study", "academic"],
        "real estate": ["real estate", "property", "home", "house", "architecture", "interior", "design"],
    }

    if industry.lower() in industry_enhancements:
        kws.extend(industry_enhancements[industry.lower()])

    # de-dupe and keep it compact
    out = []
    seen = set()
    for w in kws:
        key = str(w).strip().lower()
        if key and key not in seen and len(key) > 2:  # Filter out very short words
            out.append(str(w).strip())
            seen.add(key)
    return out[:20]  # Slightly more compact cap
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
