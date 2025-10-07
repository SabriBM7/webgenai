# analyze_components.py
import json
from pathlib import Path
from collections import Counter, defaultdict

def analyze_dataset():
    """Analyze your component dataset for duplicates and quality"""
    data_path = Path(__file__).parent / "data" / "components.jsonl"

    components_by_type = defaultdict(list)
    industries_count = Counter()
    tags_count = Counter()

    with open(data_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            try:
                component = json.loads(line)
                comp_type = component.get('type', 'Unknown')
                components_by_type[comp_type].append(component)

                # Count industries
                industries = component.get('industry', [])
                for industry in industries:
                    industries_count[industry] += 1

                # Count tags
                tags = component.get('tags', [])
                for tag in tags:
                    tags_count[tag] += 1

            except json.JSONDecodeError:
                print(f"❌ Error parsing line {line_num}")

    print("📊 COMPONENT DATASET ANALYSIS")
    print("=" * 50)

    # Show duplicates
    print("\n🔍 DUPLICATE COMPONENT TYPES:")
    for comp_type, components in components_by_type.items():
        if len(components) > 1:
            print(f"  {comp_type}: {len(components)} versions")
            # Show industries for each duplicate
            for i, comp in enumerate(components[:3]):  # Show first 3
                industries = comp.get('industry', [])
                desc = comp.get('description', '')[:60]
                print(f"    {i+1}. Industries: {industries} | Desc: {desc}")

    # Show industry coverage
    print(f"\n🏭 INDUSTRY COVERAGE (Total: {sum(industries_count.values())}):")
    for industry, count in industries_count.most_common():
        print(f"  {industry}: {count} components")

    # Show most common tags
    print(f"\n🏷️ MOST COMMON TAGS:")
    for tag, count in tags_count.most_common(20):
        print(f"  {tag}: {count}")

def find_best_components(component_type, industry=None):
    """Find the best version of a specific component type"""
    data_path = Path(__file__).parent / "data" / "components.jsonl"
    candidates = []

    with open(data_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            component = json.loads(line)
            if component.get('type') == component_type:
                # Score component quality
                score = 0

                # Bonus for specific industry match
                if industry and industry in component.get('industry', []):
                    score += 10

                # Bonus for comprehensive propsSchema
                props_schema = component.get('propsSchema', {})
                if props_schema:
                    score += len(props_schema) * 2

                # Bonus for exampleProps
                if component.get('exampleProps'):
                    score += 5

                # Bonus for detailed description
                if component.get('description'):
                    score += len(component.get('description', '')) / 10

                candidates.append((score, component))

    # Sort by score
    candidates.sort(reverse=True)

    print(f"\n🏆 BEST CANDIDATES FOR: {component_type}")
    if industry:
        print(f"   Industry filter: {industry}")
    print("=" * 50)

    for i, (score, component) in enumerate(candidates[:5]):
        industries = component.get('industry', [])
        desc = component.get('description', '')[:80]
        print(f"{i+1}. Score: {score:.1f} | Industries: {industries}")
        print(f"   Desc: {desc}")
        print(f"   Props: {list(component.get('propsSchema', {}).keys())}")
        print()

if __name__ == "__main__":
    analyze_dataset()

    # Check specific problematic components
    print("\n" + "="*60)
    find_best_components("Hero", "restaurant")
    find_best_components("Gallery", "technology")