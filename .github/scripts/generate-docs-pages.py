#!/usr/bin/env python3
"""
Generate documentation pages for all challenges
"""

import os
from pathlib import Path
import re

def markdown_to_html_simple(markdown_text):
    """Simple markdown to HTML conversion"""
    html = markdown_text

    # Headers
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)

    # Code blocks
    html = re.sub(r'```(\w+)?\n(.*?)```', r'<pre><code>\2</code></pre>', html, flags=re.DOTALL)

    # Inline code
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)

    # Bold
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)

    # Italic
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)

    # Links
    html = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', html)

    # Paragraphs
    html = re.sub(r'\n\n', r'</p><p>', html)
    html = f'<p>{html}</p>'

    # Lists
    html = re.sub(r'^\- (.+?)$', r'<li>\1</li>', html, flags=re.MULTILINE)

    return html

def generate_docs_page(challenge_dir):
    """Generate documentation page for a challenge"""
    readme_path = Path(challenge_dir) / 'README.md'
    if not readme_path.exists():
        return None

    with open(readme_path, 'r') as f:
        content = f.read()

    # Extract title from first header
    title_match = re.search(r'^#\s+(.+?)$', content, re.MULTILINE)
    title = title_match.group(1) if title_match else challenge_dir

    html_content = markdown_to_html_simple(content)

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Documentation</title>
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="stylesheet" href="../assets/docs.css">
</head>
<body>
    <header class="docs-header">
        <div class="container">
            <a href="../" class="back-link">← Back to Challenges</a>
            <h1>{title}</h1>
        </div>
    </header>

    <main class="docs-content container">
        {html_content}
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Coding Challenges</p>
        </div>
    </footer>
</body>
</html>
'''

    return html

def main():
    print("Generating documentation pages...")

    # Find all completed challenges (those with README.md)
    challenges = []
    for item in Path('.').iterdir():
        if item.is_dir() and item.name[0].isdigit():
            readme_path = item / 'README.md'
            if readme_path.exists():
                challenges.append(item.name)

    print(f"Found {len(challenges)} challenges with documentation")

    for challenge in challenges:
        print(f"  - Generating docs for {challenge}...")
        html = generate_docs_page(challenge)

        if html:
            output_dir = f'dist/{challenge}'
            os.makedirs(output_dir, exist_ok=True)

            with open(f'{output_dir}/docs.html', 'w') as f:
                f.write(html)

    print(f"✓ Generated {len(challenges)} documentation pages")

if __name__ == '__main__':
    main()
