#!/usr/bin/env python3
"""
Generate individual challenge landing pages
"""

import sys
import os
from pathlib import Path

def generate_challenge_page(challenge_dir, challenge_name):
    """Generate a landing page for a challenge"""

    # Read README if exists
    readme_path = Path(challenge_dir) / 'README.md'
    readme_content = ""
    if readme_path.exists():
        with open(readme_path, 'r') as f:
            # Convert markdown to HTML (simple conversion)
            readme_content = f.read()

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{challenge_name} - Coding Challenges</title>
    <link rel="stylesheet" href="../assets/style.css">
    <style>
        .challenge-hero {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4rem 0;
            text-align: center;
        }}
        .challenge-hero h1 {{
            font-size: 3rem;
            margin-bottom: 1rem;
        }}
        .challenge-content {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }}
        .action-buttons {{
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }}
        .action-buttons .btn {{
            padding: 1rem 2rem;
            font-size: 1.1rem;
        }}
    </style>
</head>
<body>
    <div class="challenge-hero">
        <div class="container">
            <h1>{challenge_name}</h1>
            <p>Interactive web-based implementation</p>
            <div class="action-buttons">
                <a href="./index.html" class="btn btn-primary">Launch App</a>
                <a href="../" class="btn btn-secondary">Back to All Challenges</a>
                <a href="https://github.com/Encryptioner/coding-challenges/tree/main/{challenge_dir}" class="btn btn-secondary" target="_blank">View Code</a>
            </div>
        </div>
    </div>

    <div class="challenge-content">
        <h2>About This Challenge</h2>
        <p>This is an interactive implementation that runs entirely in your browser.</p>

        <h2>Features</h2>
        <ul>
            <li>✓ Browser-only implementation (no server required)</li>
            <li>✓ Built from scratch without external libraries</li>
            <li>✓ Comprehensive documentation included</li>
            <li>✓ Educational implementation for learning</li>
        </ul>

        <h2>Quick Start</h2>
        <p><a href="./index.html" class="btn btn-primary">Click here to launch the application</a></p>

        <h2>Documentation</h2>
        <p>
            For detailed information about the implementation, see the
            <a href="https://github.com/Encryptioner/coding-challenges/tree/main/{challenge_dir}" target="_blank">GitHub repository</a>.
        </p>
    </div>

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
    if len(sys.argv) < 3:
        print("Usage: generate-challenge-page.py <challenge_dir> <challenge_name>")
        sys.exit(1)

    challenge_dir = sys.argv[1]
    challenge_name = sys.argv[2]

    print(f"Generating landing page for {challenge_name}...")

    html = generate_challenge_page(challenge_dir, challenge_name)

    # Write to dist directory
    output_dir = f'dist/{challenge_dir}'
    os.makedirs(output_dir, exist_ok=True)

    with open(f'{output_dir}/landing.html', 'w') as f:
        f.write(html)

    print(f"✓ Landing page generated for {challenge_name}")

if __name__ == '__main__':
    main()
