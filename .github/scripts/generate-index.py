#!/usr/bin/env python3
"""
Generate main index.html for GitHub Pages
"""

import os
import re

def parse_readme():
    """Parse README.md to extract challenge information"""
    challenges = []
    current_section = None

    with open('README.md', 'r') as f:
        lines = f.readlines()

    for line in lines:
        # Detect section headers
        if line.startswith('### '):
            current_section = line.strip('# \n')
            continue

        # Parse challenge lines (format: "1. [Name](./folder) - Description")
        match = re.match(r'(\d+)\.\s+\[(.+?)\]\(\.\/(.+?)\)\s+-\s+(.+?)$', line)
        if match:
            num, name, folder, description = match.groups()
            challenges.append({
                'number': int(num),
                'name': name,
                'folder': folder,
                'description': description,
                'completed': False,  # Will be updated from INDEX.md
                'section': current_section
            })

    return challenges

def get_completed_challenges():
    """Parse INDEX.md to get list of completed challenges"""
    completed = set()

    if not os.path.exists('INDEX.md'):
        return completed

    with open('INDEX.md', 'r') as f:
        lines = f.readlines()

    for line in lines:
        # Look for challenge links in INDEX.md (format: "| ✓ | [NN - Name](./folder) | ...")
        match = re.search(r'\|\s*✓\s*\|\s*\[(\d+)\s*-\s*.+?\]\(\.\/(.+?)\)', line)
        if match:
            num, folder = match.groups()
            completed.add(folder)

    return completed

def parse_extra_challenges():
    """Parse INDEX.md to extract extra challenges"""
    extra_challenges = []

    if not os.path.exists('INDEX.md'):
        return extra_challenges

    with open('INDEX.md', 'r') as f:
        lines = f.readlines()

    in_extra_section = False
    for line in lines:
        # Match exactly "## Extra Challenges" (not ###)
        if line.strip() == '## Extra Challenges':
            in_extra_section = True
            continue
        # Exit when we hit another ## section (but not ###)
        if in_extra_section and line.startswith('## ') and 'Extra Challenges' not in line:
            break

        # Parse extra challenge lines (format: "| ✓ | [NN - Name](./folder) | Description | Tech |")
        if in_extra_section and '|' in line and '✓' in line:
            # Match pattern: | ✓ | [01 - Name](./folder) | Description | Tech |
            match = re.search(r'\|\s*✓\s*\|\s*\[(\d+)\s*-\s*(.+?)\]\(\.\/(.+?)\)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|', line)
            if match:
                num, name, folder, description, tech = match.groups()
                extra_challenges.append({
                    'number': f'EX-{num}',
                    'name': name.strip(),
                    'folder': folder.strip(),
                    'description': description.strip(),
                    'tech': tech.strip(),
                    'completed': True,
                    'section': 'Extra Challenges'
                })

    return extra_challenges

def has_web_interface(folder):
    """Check if challenge has a web interface"""
    web_challenges = [
        '47-chrome-extension',
        '76-video-chat-app',
        '77-static-site-generator',
        '80-optical-character-recognition',
        '82-markdown-to-pdf'
    ]
    return folder in web_challenges

def generate_index_html(challenges, extra_challenges):
    """Generate the main index.html"""

    # Count completed challenges
    completed_count = sum(1 for c in challenges if c['completed'])
    extra_completed_count = len(extra_challenges)
    total_count = len(challenges)

    # Group by section
    sections = {}
    for challenge in challenges:
        section = challenge['section'] or 'Other'
        if section not in sections:
            sections[section] = []
        sections[section].append(challenge)

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coding Challenges - {completed_count + extra_completed_count} Implementations</title>
    <meta name="description" content="A comprehensive collection of coding challenges from CodingChallenges.fyi and experimental projects - building practical tools and applications from scratch.">
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="assets/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>🚀 Coding Challenges</h1>
            <p class="subtitle">Building {total_count} practical tools and applications from scratch</p>
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">{completed_count - extra_completed_count}</span>
                    <span class="stat-label">CodingChallenges.fyi</span>
                </div>
                <div class="stat">
                    <span class="stat-number">{extra_completed_count}</span>
                    <span class="stat-label">Extra Challenges</span>
                </div>
                <div class="stat">
                    <span class="stat-number">{completed_count}</span>
                    <span class="stat-label">Total Completed</span>
                </div>
                <div class="stat">
                    <span class="stat-number">{total_count}</span>
                    <span class="stat-label">Total Challenges</span>
                </div>
            </div>
        </div>
    </header>

    <main class="container">
        <section class="intro">
            <h2>About</h2>
            <p>
                A comprehensive collection of coding challenges from
                <a href="https://codingchallenges.fyi" target="_blank">CodingChallenges.fyi</a>
                and additional experimental challenges.
                Each challenge involves building practical programming tools, applications, and systems from scratch.
            </p>
            <p>
                Topics covered include: system programming, CLI tools, network protocols, servers,
                data structures, algorithms, web applications, games, and DevOps tools.
            </p>
            <p style="margin-top: 1rem; font-size: 0.95rem; color: #666;">
                Created by <a href="https://encryptioner.github.io" target="_blank" style="color: #4a90e2; text-decoration: none; font-weight: 500;">Ankur Mursalin</a>
            </p>
            <div class="cta-buttons">
                <a href="https://github.com/Encryptioner/coding-challenges" class="btn btn-primary" target="_blank">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    View on GitHub
                </a>
                <a href="https://codingchallenges.fyi" class="btn btn-secondary" target="_blank">
                    CodingChallenges.fyi
                </a>
            </div>
        </section>

        <section class="filter-section">
            <h2>Filter Challenges</h2>
            <div class="filters">
                <button class="filter-btn active" data-filter="all">All ({total_count})</button>
                <button class="filter-btn" data-filter="completed">Completed ({completed_count})</button>
                <button class="filter-btn" data-filter="web">Web Apps</button>
                <button class="filter-btn" data-filter="in-progress">In Progress ({total_count - completed_count})</button>
            </div>
        </section>
'''

    # Generate sections
    for section_name, section_challenges in sections.items():
        html += f'''
        <section class="challenge-section">
            <h2>{section_name}</h2>
            <div class="challenges-grid">
'''

        for challenge in section_challenges:
            completed_badge = '✓ Completed' if challenge['completed'] else 'In Progress'
            completed_class = 'completed' if challenge['completed'] else 'in-progress'
            has_web = has_web_interface(challenge['folder'])
            web_badge = '<span class="badge badge-web">Web App</span>' if has_web else ''

            github_url = f"https://github.com/Encryptioner/coding-challenges/tree/master/{challenge['folder']}"
            demo_url = f"./{challenge['folder']}/" if has_web else None

            demo_button = f'''
                    <a href="{demo_url}" class="card-btn card-btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Live Demo
                    </a>
''' if demo_url else ''

            html += f'''
                <div class="challenge-card {completed_class}" data-tags="{'completed' if challenge['completed'] else 'in-progress'} {'web' if has_web else ''}">
                    <div class="card-header">
                        <span class="challenge-number">#{challenge['number']}</span>
                        <span class="badge badge-{completed_class}">{completed_badge}</span>
                        {web_badge}
                    </div>
                    <h3 class="card-title">{challenge['name']}</h3>
                    <p class="card-description">{challenge['description']}</p>
                    <div class="card-footer">
                        <a href="{github_url}" class="card-btn" target="_blank">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            View Code
                        </a>
                        {demo_button}
                    </div>
                </div>
'''

        html += '''
            </div>
        </section>
'''

    # Add extra challenges section if any
    if extra_challenges:
        html += '''
        <section class="challenge-section">
            <h2>Extra Challenges</h2>
            <p style="margin-bottom: 1.5rem; color: #666;">Experimental and additional challenges beyond CodingChallenges.fyi</p>
            <div class="challenges-grid">
'''
        for challenge in extra_challenges:
            github_url = f"https://github.com/Encryptioner/coding-challenges/tree/master/{challenge['folder']}"

            html += f'''
                <div class="challenge-card completed" data-tags="completed">
                    <div class="card-header">
                        <span class="challenge-number">{challenge['number']}</span>
                        <span class="badge badge-completed">✓ Completed</span>
                    </div>
                    <h3 class="card-title">{challenge['name']}</h3>
                    <p class="card-description">{challenge['description']}</p>
                    <p style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;"><strong>Tech:</strong> {challenge['tech']}</p>
                    <div class="card-footer">
                        <a href="{github_url}" class="card-btn" target="_blank">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            View Code
                        </a>
                    </div>
                </div>
'''

        html += '''
            </div>
        </section>
'''

    html += '''
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Coding Challenges by <a href="https://encryptioner.github.io" target="_blank">Ankur Mursalin</a></p>
            <p>Educational implementations from <a href="https://codingchallenges.fyi" target="_blank">CodingChallenges.fyi</a> and experimental projects</p>
            <p style="margin-top: 1rem;">
                <a href="https://github.com/Encryptioner/coding-challenges" target="_blank">GitHub</a> •
                <a href="https://encryptioner.github.io" target="_blank">Website</a> •
                <a href="https://www.linkedin.com/in/mir-mursalin-ankur" target="_blank">LinkedIn</a> •
                <a href="https://twitter.com/AnkurMursalin" target="_blank">X (Twitter)</a> •
                <a href="https://nerddevs.com/author/ankur/" target="_blank">Blog</a>
            </p>
        </div>
    </footer>

    <script src="assets/script.js"></script>
</body>
</html>
'''

    return html

def main():
    print("Parsing README.md...")
    challenges = parse_readme()
    print(f"Found {len(challenges)} challenges")

    print("Getting completed challenges from INDEX.md...")
    completed = get_completed_challenges()

    # Update challenges with completed status
    for challenge in challenges:
        if challenge['folder'] in completed:
            challenge['completed'] = True

    completed_count = sum(1 for c in challenges if c['completed'])
    print(f"  - {completed_count} completed")

    print("Parsing extra challenges from INDEX.md...")
    extra_challenges = parse_extra_challenges()
    print(f"  - {len(extra_challenges)} extra challenges")

    print("Generating index.html...")
    html = generate_index_html(challenges, extra_challenges)

    # Write to dist directory
    os.makedirs('dist', exist_ok=True)
    with open('dist/index.html', 'w') as f:
        f.write(html)

    print("✓ index.html generated successfully")

if __name__ == '__main__':
    main()
