import os
import re

BUILD_DIR = "book/_build/html"

# Regex to remove the entire search form or container
SEARCH_PATTERNS = [
    re.compile(r'<form[^>]*?search[^>]*?>.*?</form>', re.DOTALL),  # Matches search forms
    re.compile(r'<div[^>]*?class="[^"]*bd-search[^"]*"[^>]*?>.*?</div>', re.DOTALL),  # Matches search div
    re.compile(r'<input[^>]*?search[^>]*?>.*?', re.DOTALL),  # Matches input fields with "search"
]

def remove_search_from_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    original_html = html
    for pattern in SEARCH_PATTERNS:
        html = pattern.sub('', html)

    if html != original_html:
        print(f"Stripped search from: {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html)

def walk_html_files():
    for root, _, files in os.walk(BUILD_DIR):
        for file in files:
            if file.endswith(".html"):
                remove_search_from_html(os.path.join(root, file))

if __name__ == "__main__":
    walk_html_files()
    print("✅ All search bars removed from built HTML.")
