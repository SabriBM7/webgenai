import json
import re
from pathlib import Path


def clean_unsplash_urls():
    """Remove all Unsplash URLs from components.jsonl and replace with placeholders"""

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
    unsplash_count = 0

    with open(data_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                cleaned_lines.append(line)
                continue

            try:
                component = json.loads(line)
                cleaned_component = remove_unsplash_urls(component)
                cleaned_lines.append(json.dumps(cleaned_component, ensure_ascii=False))
                unsplash_count += count_unsplash_urls(component)

            except json.JSONDecodeError as e:
                print(f"Error parsing line {line_num}: {e}")
                cleaned_lines.append(line)  # Keep original if can't parse

    # Write cleaned data back
    with open(data_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(cleaned_lines))

    print(f"✅ Removed {unsplash_count} Unsplash URLs")
    print(f"✅ Cleaned dataset saved to: {data_path}")


def remove_unsplash_urls(obj):
    """Recursively remove Unsplash URLs from any object"""
    if isinstance(obj, dict):
        cleaned = {}
        for key, value in obj.items():
            if isinstance(value, str) and is_unsplash_url(value):
                # Replace with placeholder based on context
                cleaned[key] = generate_placeholder(key, obj)
            elif isinstance(value, (dict, list)):
                cleaned[key] = remove_unsplash_urls(value)
            else:
                cleaned[key] = value
        return cleaned
    elif isinstance(obj, list):
        return [remove_unsplash_urls(item) for item in obj]
    else:
        return obj


def is_unsplash_url(text):
    """Check if text is an Unsplash URL"""
    unsplash_patterns = [
        'unsplash.com',
        'source.unsplash.com',
        'images.unsplash.com',
        'plus.unsplash.com'
    ]
    return any(pattern in text.lower() for pattern in unsplash_patterns)


def count_unsplash_urls(obj):
    """Count how many Unsplash URLs are in an object"""
    count = 0
    if isinstance(obj, dict):
        for value in obj.values():
            if isinstance(value, str) and is_unsplash_url(value):
                count += 1
            elif isinstance(value, (dict, list)):
                count += count_unsplash_urls(value)
    elif isinstance(obj, list):
        for item in obj:
            count += count_unsplash_urls(item)
    return count


def generate_placeholder(key, context):
    """Generate a contextual placeholder based on the field name and context"""
    key_lower = key.lower()

    # Image field placeholders
    if any(img_key in key_lower for img_key in ['image', 'src', 'avatar', 'photo', 'icon']):
        component_type = context.get('type', 'component')
        industry = context.get('industry', ['general'])[0] if context.get('industry') else 'general'

        # Generate contextual keywords
        if 'hero' in key_lower or component_type == 'Hero':
            return "{{IMAGE:restaurant,interior,dining}}"
        elif 'chef' in key_lower or 'bio' in key_lower:
            return "{{IMAGE:chef,portrait,professional}}"
        elif 'menu' in key_lower or 'dish' in key_lower:
            return "{{IMAGE:food,plated,gourmet}}"
        elif 'gallery' in key_lower:
            return "{{IMAGE:restaurant,ambiance,interior}}"
        elif 'wine' in key_lower:
            return "{{IMAGE:wine,bottle,cellar}}"
        elif 'team' in key_lower:
            return "{{IMAGE:professional,team,staff}}"
        else:
            return "{{IMAGE:" + industry + ",business,professional}}"

    return "{{PLACEHOLDER}}"


if __name__ == "__main__":
    clean_unsplash_urls()