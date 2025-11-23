#!/usr/bin/env python3
"""
Extract web-deployable challenges from INDEX.md
Outputs space-separated list of folder names
"""

import re
import sys

def get_web_challenges():
    """Extract web-deployable challenge folders from INDEX.md"""
    web_challenges = []

    try:
        with open('INDEX.md', 'r') as f:
            content = f.read()
    except FileNotFoundError:
        return []

    # Find "Web-Deployable Challenges" section
    in_web_section = False
    for line in content.split('\n'):
        if '### Web-Deployable Challenges' in line or '## Web-Deployable Challenges' in line:
            in_web_section = True
            continue
        if in_web_section and (line.startswith('###') or line.startswith('##')):
            break

        # Parse web challenge lines (format: "1. [NN - Name](./folder) - Description")
        if in_web_section and re.match(r'^\d+\.', line):
            match = re.search(r'\[(?:\d+)\s*-\s*.+?\]\(\.\/(.+?)\)', line)
            if match:
                folder = match.group(1)
                web_challenges.append(folder)

    return web_challenges

if __name__ == '__main__':
    challenges = get_web_challenges()
    print(' '.join(challenges))
