
import os
import re

def update_footer(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Regex to find the footer bottom p tag
        # It matches: <div class="footer-bottom">...<p>...Content...</p>...</div>
        # We need to be careful about whitespace
        pattern = re.compile(r'(<div class="footer-bottom">\s*<p>)(.*?)(<\/p>\s*<\/div>)', re.DOTALL)
        
        match = pattern.search(content)
        if match:
            # Check if links already exist to avoid duplication
            if "Privacy & Safety" in match.group(2):
                print(f"Skipping {file_path}: Links already match.")
                return

            original_text = match.group(2).strip()
            # For pages in 'pages/' directory, links should be relative to that directory (siblings)
            new_text = f'{original_text} | <a href="privacy.html" style="color: inherit; text-decoration: none;">Privacy & Safety</a> | <a href="terms.html" style="color: inherit; text-decoration: none;">Terms & Conditions</a>'
            
            new_content = content.replace(match.group(0), f'{match.group(1)}{new_text}{match.group(3)}')
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")
        else:
            print(f"Warning: Footer pattern not found in {file_path}")

    except Exception as e:
        print(f"Error updating {file_path}: {e}")

def main():
    pages_dir = r"c:\Users\hdlfr\OneDrive\Desktop\St. Bernadine Official Website\pages"
    
    if not os.path.exists(pages_dir):
        print(f"Directory not found: {pages_dir}")
        return

    for filename in os.listdir(pages_dir):
        if filename.endswith(".html"):
            file_path = os.path.join(pages_dir, filename)
            update_footer(file_path)

if __name__ == "__main__":
    main()
