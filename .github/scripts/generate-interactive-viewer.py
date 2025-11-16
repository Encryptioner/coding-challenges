#!/usr/bin/env python3
"""
Generate interactive documentation viewer for web-based challenges
"""

import os
import sys
import re
from pathlib import Path
import markdown2

def convert_markdown_to_html(md_file):
    """Convert markdown file to HTML"""
    if not Path(md_file).exists():
        return None

    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Use markdown2 for conversion with extras
    html = markdown2.markdown(
        md_content,
        extras=[
            'fenced-code-blocks',
            'tables',
            'code-friendly',
            'cuddled-lists',
            'header-ids'
        ]
    )

    return html

def find_docs_files(challenge_dir):
    """Find all documentation files for a challenge"""
    docs = []

    # Main README
    readme = Path(challenge_dir) / 'README.md'
    if readme.exists():
        docs.append({
            'name': 'Overview',
            'file': 'README.md',
            'icon': 'home'
        })

    # Challenge description
    challenge_md = Path(challenge_dir) / 'challenge.md'
    if challenge_md.exists():
        docs.append({
            'name': 'Challenge',
            'file': 'challenge.md',
            'icon': 'target'
        })

    # Documentation files in docs folder
    docs_dir = Path(challenge_dir) / 'docs'
    if docs_dir.exists():
        doc_files = [
            ('implementation.md', 'Implementation', 'code'),
            ('examples.md', 'Examples', 'book-open'),
            ('algorithms.md', 'Algorithms', 'cpu'),
            ('tutorial.md', 'Tutorial', 'graduation-cap'),
            ('api.md', 'API Reference', 'terminal')
        ]

        for filename, name, icon in doc_files:
            file_path = docs_dir / filename
            if file_path.exists():
                docs.append({
                    'name': name,
                    'file': f'docs/{filename}',
                    'icon': icon
                })

    return docs

def get_icon_svg(icon_name):
    """Get SVG icon by name"""
    icons = {
        'home': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
        'target': '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
        'code': '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
        'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
        'cpu': '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>',
        'graduation-cap': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>',
        'terminal': '<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>'
    }
    return icons.get(icon_name, icons['home'])

def generate_viewer_html(challenge_dir, challenge_name):
    """Generate interactive documentation viewer HTML"""

    docs_files = find_docs_files(challenge_dir)

    if not docs_files:
        return None

    # Build navigation
    nav_items = []
    for doc in docs_files:
        icon_svg = get_icon_svg(doc['icon'])
        nav_items.append(f'''
            <a href="#" class="docs-nav-item" data-doc="{doc['file']}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    {icon_svg}
                </svg>
                {doc['name']}
            </a>
        ''')

    nav_html = ''.join(nav_items)

    # Check if challenge has a live app
    has_app = (Path(challenge_dir) / 'index.html').exists()
    app_url = './app.html' if has_app else None

    # Build conditional HTML parts
    if has_app:
        app_buttons_html = '''
                    <button class="view-btn" data-view="app" title="App Only">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        App
                    </button>
                    <button class="view-btn active" data-view="split" title="Split View">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="12" y1="3" x2="12" y2="21"></line>
                        </svg>
                        Split
                    </button>'''

        app_pane_html = '''
                <!-- Resizer -->
                <div class="resizer"></div>

                <!-- App Pane -->
                <div class="split-pane app-pane">
                    <iframe src="./app.html" class="app-frame" title="Live Application"></iframe>
                </div>'''
    else:
        app_buttons_html = ''
        app_pane_html = f'''
                <!-- No App Placeholder -->
                <div class="split-pane app-pane">
                    <div class="app-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        <h3>No Live Demo</h3>
                        <p>This challenge doesn't have a browser-based implementation.</p>
                        <a href="https://github.com/Encryptioner/coding-challenges/tree/main/{challenge_dir}" class="btn btn-primary" target="_blank">View on GitHub</a>
                    </div>
                </div>'''

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{challenge_name} - Interactive Documentation</title>
    <link rel="stylesheet" href="../assets/style.css">
    <link rel="stylesheet" href="../assets/docs.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
    <div class="interactive-viewer">
        <!-- Sidebar -->
        <aside class="docs-sidebar">
            <div class="docs-sidebar-header">
                <a href="../" class="back-link">← All Challenges</a>
                <h2>{challenge_name}</h2>
            </div>
            <nav class="docs-nav">
                <div class="docs-nav-section">
                    <h3>Documentation</h3>
                    {nav_html}
                </div>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="docs-main">
            <!-- Top Bar -->
            <div class="docs-topbar">
                <h1 class="docs-title">Documentation</h1>
                <div class="view-controls">
                    <button class="view-btn" data-view="docs" title="Documentation Only">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        Docs
                    </button>
                    {app_buttons_html}
                </div>
            </div>

            <!-- Split Container -->
            <div class="split-container split-view">
                <!-- Documentation Pane -->
                <div class="split-pane docs-pane">
                    <div class="docs-content">
                        <div class="docs-loading">
                            <p>Loading documentation...</p>
                        </div>
                    </div>
                </div>

                {app_pane_html}
            </div>
        </main>
    </div>

    <!-- Mobile Menu Button -->
    <button class="mobile-menu-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    </button>

    <!-- Mobile Sidebar Overlay -->
    <div class="sidebar-overlay"></div>

    <script src="../assets/docs-viewer.js"></script>
</body>
</html>
'''

    return html

def generate_docs_html_files(challenge_dir, output_dir):
    """Generate individual HTML files for each documentation file"""
    docs_files = find_docs_files(challenge_dir)

    for doc in docs_files:
        md_path = Path(challenge_dir) / doc['file']
        html_content = convert_markdown_to_html(md_path)

        if html_content:
            # Save as HTML file
            output_file = Path(output_dir) / doc['file'].replace('.md', '.html')
            output_file.parent.mkdir(parents=True, exist_ok=True)

            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)

def main():
    if len(sys.argv) < 3:
        print("Usage: generate-interactive-viewer.py <challenge_dir> <challenge_name>")
        sys.exit(1)

    challenge_dir = sys.argv[1]
    challenge_name = sys.argv[2]

    print(f"Generating interactive viewer for {challenge_name}...")

    # Generate main viewer HTML
    viewer_html = generate_viewer_html(challenge_dir, challenge_name)

    if not viewer_html:
        print(f"  No documentation found for {challenge_name}")
        return

    # Create output directory
    output_dir = f'dist/{challenge_dir}'
    os.makedirs(output_dir, exist_ok=True)

    # Write viewer HTML
    with open(f'{output_dir}/index.html', 'w', encoding='utf-8') as f:
        f.write(viewer_html)

    # Generate individual doc HTML files
    generate_docs_html_files(challenge_dir, output_dir)

    # Copy app if it exists
    app_path = Path(challenge_dir) / 'index.html'
    if app_path.exists():
        import shutil
        shutil.copy(app_path, f'{output_dir}/app.html')

        # Copy static assets
        for asset_dir in ['static', 'css', 'js', 'images', 'assets']:
            asset_path = Path(challenge_dir) / asset_dir
            if asset_path.exists():
                shutil.copytree(
                    asset_path,
                    f'{output_dir}/{asset_dir}',
                    dirs_exist_ok=True
                )

    print(f"✓ Interactive viewer generated for {challenge_name}")

if __name__ == '__main__':
    main()
