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
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="stylesheet" href="../assets/docs.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f9fafb;
        }}
        .docs-header {{
            background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
            padding: 1.5rem 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }}
        .docs-header .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        .docs-header-content {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }}
        .challenge-title {{
            color: white;
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
            flex: 1;
        }}
        .back-button {{
            display: inline-flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
            background: rgba(255, 255, 255, 0.2) !important;
            color: white !important;
            padding: 0.75rem 1.25rem !important;
            border-radius: 0.5rem !important;
            text-decoration: none !important;
            font-weight: 500 !important;
            transition: all 0.2s !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            white-space: nowrap !important;
        }}
        .back-button:hover {{
            background: rgba(255, 255, 255, 0.3) !important;
            transform: translateX(-4px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }}
        .back-button svg {{
            transition: transform 0.2s;
        }}
        .back-button:hover svg {{
            transform: translateX(-2px);
        }}
        .docs-content.container {{
            max-width: 1200px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            min-height: calc(100vh - 200px);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 0.5rem;
            line-height: 1.7;
        }}
        @media (max-width: 768px) {{
            .docs-header {{
                padding: 1rem;
            }}
            .docs-header-content {{
                flex-direction: column;
                align-items: flex-start;
                gap: 0.75rem;
            }}
            .challenge-title {{
                font-size: 1.125rem;
                order: 2;
            }}
            .back-button {{
                padding: 0.625rem 1rem !important;
                font-size: 0.875rem !important;
                order: 1;
            }}
            .docs-content.container {{
                padding: 1.5rem 1rem;
                margin: 1rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="docs-header">
        <div class="container">
            <div class="docs-header-content">
                <a href="../" class="back-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back to All Challenges
                </a>
                <h1 class="challenge-title">{title}</h1>
            </div>
        </div>
    </div>

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
