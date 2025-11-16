# GitHub Pages Configuration

This directory contains assets and configuration for the GitHub Pages deployment of the Coding Challenges repository.

## Overview

The GitHub Pages site provides:
- **Main Index**: Browse all 94 coding challenges with filtering
- **Interactive Documentation Viewer**: View tutorials alongside live implementations
- **Live Demos**: Browser-based implementations for web challenges

## Structure

```
.github/pages/
├── assets/
│   ├── style.css          # Main site styles
│   ├── docs.css           # Interactive documentation viewer styles
│   ├── script.js          # Main site JavaScript (filtering)
│   └── docs-viewer.js     # Interactive viewer JavaScript
├── 404.html               # Custom 404 page
└── README.md              # This file
```

## Deployment

The site is automatically deployed when changes are pushed to the `main` branch.

### Workflow

1. **Build Phase** (`.github/workflows/deploy-pages.yml`):
   - Checkout repository
   - Install Python dependencies
   - Run build script
   - Generate static site in `dist/`

2. **Build Script** (`.github/scripts/build-site.sh`):
   - Creates `dist/` directory
   - Generates main index page from README.md
   - Creates interactive documentation viewers for web challenges
   - Converts markdown documentation to HTML
   - Copies static assets

3. **Deploy Phase**:
   - Uploads `dist/` as GitHub Pages artifact
   - Deploys to GitHub Pages

## Interactive Documentation Viewer

The interactive viewer provides a split-pane interface with:

### Features

- **Documentation Pane**: View converted markdown tutorials
- **App Pane**: Live implementation iframe
- **View Modes**:
  - Docs only
  - App only
  - Split view (default)
- **Sidebar Navigation**: Switch between different docs
- **Mobile Responsive**: Collapsible sidebar
- **Copy Buttons**: One-click code copying
- **Table of Contents**: Auto-generated from headings

### Supported Challenges

Web-based challenges with live demos:
- 47: Chrome Extension
- 76: Video Chat App
- 77: Static Site Generator
- 80: Optical Character Recognition (OCR)
- 82: Markdown to PDF

## URL Structure

```
https://encryptioner.github.io/coding-challenges/
├── /                               # Main index
├── /82-markdown-to-pdf/            # Interactive viewer
│   ├── /index.html                 # Viewer entry point
│   ├── /app.html                   # Live app
│   ├── /README.html                # Overview docs
│   ├── /challenge.html             # Challenge description
│   └── /docs/
│       ├── /implementation.html
│       ├── /examples.html
│       └── /algorithms.html
└── /404.html                       # Not found page
```

## Adding New Web Challenges

To add a new web-based challenge to the deployment:

1. **Update build script** (`.github/scripts/build-site.sh`):
   ```bash
   declare -A WEB_CHALLENGES=(
     # ... existing challenges ...
     ["NN-challenge-name"]="Display Name"
   )
   ```

2. **Ensure challenge structure**:
   ```
   NN-challenge-name/
   ├── index.html          # Main app (will be copied as app.html)
   ├── README.md           # Overview documentation
   ├── challenge.md        # Challenge requirements
   ├── docs/
   │   ├── implementation.md
   │   ├── examples.md
   │   └── algorithms.md
   └── static/             # Assets (copied automatically)
   ```

3. **Commit and push**: The workflow will automatically deploy

## Scripts

### generate-index.py

Generates the main index page by:
- Parsing `README.md` for challenge list
- Extracting metadata (number, name, description, completed status)
- Creating filterable grid of challenge cards
- Adding links to GitHub and live demos

### generate-interactive-viewer.py

Creates the interactive documentation viewer for each challenge:
- Scans for documentation files (README.md, challenge.md, docs/)
- Converts markdown to HTML using markdown2
- Generates navigation sidebar
- Embeds live app in iframe
- Creates responsive split-pane layout

### generate-docs-pages.py

Converts standalone documentation pages:
- Finds all challenges with README.md
- Converts markdown to simple HTML
- Generates documentation-only pages

## Customization

### Styling

- `assets/style.css`: Main site colors, layout, components
- `assets/docs.css`: Interactive viewer styles, split-pane, sidebar

### Features

- `assets/script.js`: Challenge filtering logic
- `assets/docs-viewer.js`: Documentation viewer interactivity

## Local Development

Test the build locally:

```bash
# Install dependencies
pip install -r .github/requirements.txt

# Run build
.github/scripts/build-site.sh

# Serve locally
cd dist
python3 -m http.server 8000

# Visit http://localhost:8000
```

## GitHub Pages Settings

Ensure repository settings:
- **Settings** → **Pages**
- **Source**: GitHub Actions
- **Custom domain** (optional): Configure as needed

## Troubleshooting

### Build Fails

- Check Python version (requires 3.11+)
- Verify markdown2 is installed
- Check scripts are executable: `chmod +x .github/scripts/*.sh`

### Challenge Not Appearing

- Verify challenge is marked with ✓ in README.md
- Check challenge has `index.html` for web demos
- Ensure added to `WEB_CHALLENGES` in build script

### Documentation Not Loading

- Verify markdown files exist
- Check file paths in viewer
- Inspect browser console for errors

## License

Educational implementations for CodingChallenges.fyi.
