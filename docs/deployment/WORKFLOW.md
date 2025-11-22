# GitHub Pages Deployment Workflow

Quick reference guide for deploying coding challenges to GitHub Pages.

## Overview

This repo auto-deploys to GitHub Pages, creating:
- **Main page**: Filterable grid of all challenges
- **Web challenges**: Interactive viewers with docs + live demos
- **Documentation**: All challenge documentation in HTML format

## Prerequisites

- Python 3.11+
- Git
- GitHub repo with Pages enabled

## One-Time Setup

### 1. Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Set **Source** to **GitHub Actions**
3. Click **Save**

### 2. Activate Auto-Deployment

Add the workflow file to your main branch:

```bash
# On main/master branch
mkdir -p .github/workflows
cp .github/workflow-templates/deploy-pages.yml .github/workflows/
git add .github/workflows/deploy-pages.yml
git commit -m "feat: activate auto-deployment"
git push origin main
```

**That's it!** Every push to main will now auto-deploy.

## Local Testing

Test before deploying:

```bash
# Quick test
./DOCS/deployment/deploy-github-pages.sh

# Or manual build
.github/scripts/build-site.sh
cd dist && python3 -m http.server 8000
# Visit http://localhost:8000
```

## Adding a New Web Challenge

Web challenges get interactive viewers with split-pane docs + live demos.

### 1. Create Challenge Structure

```
NN-challenge-name/
├── index.html              # Main app (required for web demo)
├── README.md               # Overview documentation
├── CHALLENGE.md            # Challenge requirements (optional)
├── docs/                   # Tutorial docs (optional)
│   ├── implementation.md
│   ├── examples.md
│   └── algorithms.md
└── static/                 # Assets (CSS, JS, images)
```

### 2. Register Challenge

Edit `.github/scripts/build-site.sh`:

```bash
declare -A WEB_CHALLENGES=(
  # ... existing challenges ...
  ["NN-challenge-name"]="Display Name"
)
```

### 3. Deploy

```bash
git add .
git commit -m "feat: add NN-challenge-name"
git push origin main
```

The site updates automatically in 1-2 minutes.

## Deployment URLs

```
https://[username].github.io/coding-challenges/
├── /                           # Main index
├── /NN-challenge-name/         # Interactive viewer
│   ├── index.html              # Viewer with split panes
│   ├── app.html                # Live demo
│   ├── README.html             # Overview
│   └── docs/*.html             # Tutorials
```

## Build System

**Main orchestrator**: `.github/scripts/build-site.sh`

**Key scripts**:
- `generate-index.py` - Main index page
- `generate-interactive-viewer.py` - Split-pane viewers
- `generate-docs-pages.py` - Markdown → HTML

**Assets**: `.github/pages/assets/` (CSS, JS)

**Output**: `dist/` directory (deployed to Pages)

## Common Tasks

### Update Main Index

Edit root `README.md` with challenge list, then push:

```bash
git add README.md
git commit -m "docs: update challenge list"
git push origin main
```

### Add Documentation Only (No Web Demo)

Just create `README.md` and `docs/` in challenge folder. The build script auto-converts all markdown to HTML.

### Customize Styling

Edit `.github/pages/assets/`:
- `style.css` - Main site
- `docs.css` - Interactive viewers
- `script.js` - Challenge filtering
- `docs-viewer.js` - Split-pane functionality

### Force Rebuild

```bash
git commit --allow-empty -m "chore: rebuild site"
git push origin main
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Workflow not running | Check workflow file is on main branch, Pages enabled |
| Build fails | Check Actions logs, verify Python 3.11+ available |
| Challenge not appearing | Ensure added to `WEB_CHALLENGES`, has `index.html` |
| 404 errors | Wait 2-3 minutes after first deploy, clear cache |
| Changes not showing | Check Actions tab for build status, clear browser cache |

## Quick Reference

```bash
# Test locally
./DOCS/deployment/deploy-github-pages.sh

# Manual build
.github/scripts/build-site.sh

# Check deployment status
cat DOCS/deployment/AUTO-DEPLOY-STATUS.md

# View detailed guide
cat DOCS/deployment/DEPLOYMENT.md
```

## File Structure

```
.github/
├── scripts/
│   ├── build-site.sh              # Main build script
│   ├── generate-index.py          # Index generator
│   ├── generate-interactive-viewer.py
│   └── generate-docs-pages.py
├── pages/
│   ├── assets/                    # CSS, JS, images
│   └── 404.html
├── workflows/
│   └── deploy-pages.yml           # Auto-deploy workflow
└── workflow-templates/
    └── deploy-pages.yml           # Template (copy to workflows/)

DOCS/deployment/
├── workflow.md                    # This file
├── deploy-github-pages.sh         # Local testing script
├── enable-auto-deploy.sh          # Activation guide
├── DEPLOYMENT.md                  # Complete documentation
└── AUTO-DEPLOY-STATUS.md          # Current status

dist/                              # Build output (auto-generated)
```

---

**Quick Start**: `./DOCS/deployment/deploy-github-pages.sh` → Follow instructions → Done! 🚀
