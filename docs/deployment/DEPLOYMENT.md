# GitHub Pages Deployment Guide

Complete documentation for deploying coding challenges to GitHub Pages.

> **Quick Reference**: See [WORKFLOW.md](./WORKFLOW.md) for a concise deployment workflow.
> **Status**: See [SETUP.md](./SETUP.md) for current deployment status.

## Overview

This repository auto-deploys to GitHub Pages, creating an interactive showcase of all coding challenges with:
- **Main index**: Filterable grid of all 94 challenges
- **Interactive viewers**: Split-pane docs + live demos for web challenges
- **Documentation**: All challenge docs converted to HTML
- **Live demos**: Embedded web applications

## Quick Start

### Local Testing
```bash
./DOCS/deployment/deploy-github-pages.sh
```

This script:
- Verifies all required files
- Builds the site locally in `dist/`
- Optionally starts a preview server
- Provides next steps

### Activate Auto-Deployment

See [SETUP.md](./SETUP.md) for activation instructions.

**Summary:**
1. Enable GitHub Pages (Settings → Pages → Source: GitHub Actions)
2. Add workflow file to main branch
3. Push to main → site auto-deploys

## Site Structure

Once deployed:

```
https://[username].github.io/coding-challenges/
├── /                           # Main index (all challenges)
├── /NN-challenge-name/         # Interactive viewer (web challenges)
│   ├── index.html              # Viewer with split panes
│   ├── app.html                # Live demo
│   ├── README.html             # Overview
│   └── docs/*.html             # Tutorials
└── /404.html                   # Custom 404 page
```

## Adding Challenges

### Web Challenge (with Live Demo)

1. **Create structure**:
```
NN-challenge-name/
├── index.html              # Main app (required)
├── README.md               # Overview
├── CHALLENGE.md            # Requirements (optional)
├── docs/                   # Tutorials (optional)
│   ├── implementation.md
│   ├── examples.md
│   └── algorithms.md
└── static/                 # Assets
```

2. **Register in build script** (`.github/scripts/build-site.sh`):
```bash
declare -A WEB_CHALLENGES=(
  ["NN-challenge-name"]="Display Name"
)
```

3. **Deploy**:
```bash
git add .
git commit -m "feat: add NN-challenge-name"
git push origin main
```

### Documentation-Only Challenge

Just create `README.md` and `docs/` folder. The build script auto-converts markdown to HTML.

## Build System

### Scripts (`.github/scripts/`)
- `build-site.sh` - Main orchestrator
- `generate-index.py` - Creates main index from README.md
- `generate-interactive-viewer.py` - Builds split-pane viewers
- `generate-docs-pages.py` - Converts markdown to HTML

### Assets (`.github/pages/assets/`)
- `style.css` - Main site styling
- `docs.css` - Interactive viewer styles
- `script.js` - Challenge filtering
- `docs-viewer.js` - Split-pane functionality

### Workflow (`.github/workflows/deploy-pages.yml`)
- Triggers on push to main
- Builds site (30-60 seconds)
- Deploys to GitHub Pages
- Updates live site automatically

## Customization

### Styling
Edit CSS files in `.github/pages/assets/`:
- `style.css` - Main index appearance
- `docs.css` - Viewer layout and design

### Functionality
Edit JS files in `.github/pages/assets/`:
- `script.js` - Add filters, modify grid
- `docs-viewer.js` - Change viewer behavior

### Build Process
Modify scripts in `.github/scripts/`:
- `build-site.sh` - Add new challenge types
- `generate-index.py` - Customize index layout
- `generate-interactive-viewer.py` - Modify viewer template

## Troubleshooting

### Build Failures

**Check Python version:**
```bash
python3 --version  # Should be 3.11+
```

**Install dependencies:**
```bash
pip install -r .github/requirements.txt
```

**Test locally:**
```bash
./DOCS/deployment/deploy-github-pages.sh
```

### Deployment Issues

| Issue | Solution |
|-------|----------|
| Workflow not running | Ensure workflow file is on main branch, Pages enabled |
| Build fails | Check Actions logs, verify dependencies installed |
| Challenge not appearing | Add to `WEB_CHALLENGES`, ensure `index.html` exists |
| 404 errors | Check `.nojekyll` exists, verify folder names |
| Changes not showing | Clear browser cache, check Actions tab |

### Local Testing

```bash
# Build site
.github/scripts/build-site.sh

# Preview locally
cd dist && python3 -m http.server 8000

# Visit http://localhost:8000
```

## Deployed Challenges

Currently deployed web challenges with interactive viewers:

| # | Name | Features |
|---|------|----------|
| 47 | Chrome Extension | Clipboard manager demo |
| 69 | Notion Clone | Block-based editor |
| 76 | Video Chat App | WebRTC implementation |
| 77 | Static Site Generator | Markdown to HTML |
| 80 | OCR Tool | Tesseract.js integration |
| 82 | Markdown to PDF | PDF generation |

See [INDEX.md](../../INDEX.md) for complete challenge list.

## Requirements

**Development:**
- Python 3.11+
- Git
- pip (Python package manager)

**GitHub:**
- Repository with Pages enabled
- GitHub Actions workflow file
- Permissions to deploy (write access)

**Dependencies:**
- markdown2 (markdown conversion)
- jinja2 (templating)

## Documentation Files

```
DOCS/deployment/
├── README.md                      # Navigation guide (start here)
├── SETUP.md                       # First-time setup and activation
├── WORKFLOW.md                    # Quick workflow reference
├── DEPLOYMENT.md                  # This file (complete guide)
├── deploy-github-pages.sh         # Local testing script
└── enable-auto-deploy.sh          # Interactive activation guide
```

## Additional Resources

- **Workflow Guide**: [WORKFLOW.md](./WORKFLOW.md) - Quick reference for common tasks
- **Setup Guide**: [SETUP.md](./SETUP.md) - First-time setup and activation
- **GitHub Setup**: [.github/GITHUB_PAGES_SETUP.md](../../.github/GITHUB_PAGES_SETUP.md) - Technical setup
- **Pages Assets**: [.github/pages/README.md](../../.github/pages/README.md) - Asset documentation

---

**Ready to deploy?** Start with [SETUP.md](./SETUP.md) for first-time setup or [WORKFLOW.md](./WORKFLOW.md) for quick reference! 🚀
