import json
import re
from pathlib import Path


def clean_all_image_urls():
    """Remove ALL image URLs from components.jsonl and replace with placeholders"""

    # Path to your components file
    data_path = Path(__file__).parent / "data" / "components.jsonl"
    backup_path = Path(__file__).parent / "data" / "components.jsonl.backup"

    # Create backup first
    with open(data_path, 'r', encoding='utf-8') as f:
        original_content = f.read()
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(original_content)

    print(f"Backup created at: {backup_path}")

    # Process each line
    cleaned_lines = []
    url_count = 0

    with open(data_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                cleaned_lines.append(line)
                continue

            try:
                component = json.loads(line)
                cleaned_component = remove_all_image_urls(component)
                cleaned_lines.append(json.dumps(cleaned_component, ensure_ascii=False))
                url_count += count_image_urls(component)

            except json.JSONDecodeError as e:
                print(f"Error parsing line {line_num}: {e}")
                cleaned_lines.append(line)

    # Write cleaned data back
    with open(data_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(cleaned_lines))

    print(f"✅ Removed {url_count} image URLs from all sources")
    print(f"✅ Cleaned dataset saved to: {data_path}")


def remove_all_image_urls(obj):
    """Recursively remove ALL image URLs from any object"""
    if isinstance(obj, dict):
        cleaned = {}
        for key, value in obj.items():
            if isinstance(value, str) and is_image_url(value):
                # Replace with contextual placeholder
                cleaned[key] = generate_contextual_placeholder(key, obj)
            elif isinstance(value, (dict, list)):
                cleaned[key] = remove_all_image_urls(value)
            else:
                cleaned[key] = value
        return cleaned
    elif isinstance(obj, list):
        return [remove_all_image_urls(item) for item in obj]
    else:
        return obj


def is_image_url(text):
    """Check if text is ANY image URL"""
    image_patterns = [
        'unsplash.com',
        'picsum.photos',
        'img.icons8.com',
        'http://',  # Any HTTP URL
        'https://',  # Any HTTPS URL
        '.jpg', '.jpeg', '.png', '.gif', '.webp'  # Image file extensions
    ]
    text_lower = text.lower()
    return any(pattern in text_lower for pattern in image_patterns) and len(text) > 10


def count_image_urls(obj):
    """Count how many image URLs are in an object"""
    count = 0
    if isinstance(obj, dict):
        for value in obj.values():
            if isinstance(value, str) and is_image_url(value):
                count += 1
            elif isinstance(value, (dict, list)):
                count += count_image_urls(value)
    elif isinstance(obj, list):
        for item in obj:
            count += count_image_urls(item)
    return count


def generate_contextual_placeholder(key, context):
    """Generate a contextual placeholder based on the field name and context"""
    key_lower = key.lower()
    component_type = context.get('type', 'component')
    industry = context.get('industry', ['general'])[0] if context.get('industry') else 'general'

    # Handle different image field types
    if any(img_key in key_lower for img_key in ['image', 'src', 'avatar', 'photo', 'icon', 'logo', 'background']):

        # Component-specific placeholders
        if component_type == 'Hero':
            return "{{IMAGE:restaurant,interior,hero}}"
        elif component_type == 'Gallery':
            return "{{IMAGE:restaurant,gallery,ambiance}}"
        elif component_type == 'ChefBio':
            return "{{IMAGE:chef,portrait,professional}}"
        elif component_type == 'Team':
            return "{{IMAGE:team,professional,staff}}"
        elif component_type == 'DishGrid' or 'menu' in key_lower:
            return "{{IMAGE:food,dish,gourmet}}"
        elif component_type == 'Testimonials' or 'avatar' in key_lower:
            return "{{IMAGE:customer,portrait,avatar}}"
        elif component_type == 'AwardsBar' or 'logo' in key_lower:
            return "{{IMAGE:logo,award,badge}}"
        elif component_type == 'WineListHighlight' or 'wine' in key_lower:
            return "{{IMAGE:wine,bottle,cellar}}"
        elif 'gallery' in key_lower or 'images' in key_lower:
            return "{{IMAGE:gallery,collection,showcase}}"
        elif 'background' in key_lower:
            return "{{IMAGE:background,scene,setting}}"
        else:
            # Generic placeholder based on industry
            return f"{{{{IMAGE:{industry},business,professional}}}}"

    return "{{PLACEHOLDER}}"


def clean_example_props_images(component):
    """Special handling for exampleProps with image arrays"""
    if 'exampleProps' in component and isinstance(component['exampleProps'], dict):
        example_props = component['exampleProps']

        # Handle image arrays in Gallery components
        if 'images' in example_props and isinstance(example_props['images'], list):
            example_props['images'] = ["{{IMAGE:gallery,photo,image}}" for _ in example_props['images']]

        # Handle logos arrays
        if 'logos' in example_props and isinstance(example_props['logos'], list):
            for logo in example_props['logos']:
                if isinstance(logo, dict):
                    if 'src' in logo:
                        logo['src'] = "{{IMAGE:logo,brand,company}}"
                    if 'background' in logo:
                        logo['background'] = "{{IMAGE:background,texture,pattern}}"

        # Handle items arrays with images
        if 'items' in example_props and isinstance(example_props['items'], list):
            for item in example_props['items']:
                if isinstance(item, dict):
                    for field in ['image', 'avatar', 'photo', 'icon']:
                        if field in item and isinstance(item[field], str) and is_image_url(item[field]):
                            item[field] = generate_contextual_placeholder(field, component)


# Enhanced main function
def clean_all_image_urls_enhanced():
    """Enhanced version that handles all image URL cases"""

    data_path = Path(__file__).parent / "data" / "components.jsonl"
    backup_path = Path(__file__).parent / "data" / "components.jsonl.backup"

    # Create backup
    with open(data_path, 'r', encoding='utf-8') as f:
        original_content = f.read()
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(original_content)

    print(f"Backup created at: {backup_path}")

    cleaned_lines = []
    total_urls_removed = 0

    with open(data_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                cleaned_lines.append(line)
                continue

            try:
                component = json.loads(line)

                # Clean main component
                cleaned_component = remove_all_image_urls(component)

                # Special handling for exampleProps with arrays
                clean_example_props_images(cleaned_component)

                cleaned_lines.append(json.dumps(cleaned_component, ensure_ascii=False))
                total_urls_removed += count_image_urls(component)

            except json.JSONDecodeError as e:
                print(f"Error parsing line {line_num}: {e}")
                cleaned_lines.append(line)

    # Write cleaned data back
    with open(data_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(cleaned_lines))

    print(f"✅ Removed {total_urls_removed} image URLs from ALL sources")
    print(f"✅ Cleaned dataset saved to: {data_path}")
    print("✅ All Unsplash, Picsum, and other image URLs replaced with placeholders")


if __name__ == "__main__":
    clean_all_image_urls_enhanced()