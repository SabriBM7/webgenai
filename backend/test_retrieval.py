# test_retrieval.py
from rag.vectorstore import retrieve_by_roles_payload, debug_retrieval

def test_industry_retrieval(industry, business_description):
    print(f"\n🧪 TESTING: {industry.upper()}")
    print(f"Description: {business_description}")
    print("=" * 60)

    q_terms = [
        industry,
        "modern",
        business_description[:100]
    ]

    # Use the debug function
    debug_retrieval(q_terms, industry)

    # Get actual payload
    rag_payload = retrieve_by_roles_payload(
        q_terms=q_terms,
        industry=industry,
        style="modern",
        need_images=True,
        k=8
    )

    templates = rag_payload.get("templates", [])
    print(f"\n🎯 FINAL SELECTION ({len(templates)} components):")
    for i, template in enumerate(templates):
        score = template.get('_score', 0)
        role = template.get('_role', 'unknown')
        print(f"  {i+1}. {template.get('type')} | Role: {role} | Score: {score:.3f}")

# Test all industries
test_cases = [
    ("restaurant", "Authentic Italian wood-fired restaurant with handmade pasta"),
    ("technology", "Cloud infrastructure automation platform for DevOps teams"),
    ("healthcare", "Mental health clinic offering therapy and wellness services"),
    ("fitness", "Modern fitness studio with personal training and group classes"),
    ("beauty", "Luxury spa offering skincare treatments and relaxation services")
]

for industry, description in test_cases:
    test_industry_retrieval(industry, description)