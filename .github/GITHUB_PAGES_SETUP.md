# GitHub Pages Setup Instructions

This repository includes a complete GitHub Pages deployment system with interactive documentation viewers. Due to security restrictions, the workflow file must be added through the GitHub web interface or a pull request.

## Quick Setup

### Step 1: Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save the configuration

### Step 2: Add Workflow File

The workflow file `.github/workflows/deploy-pages.yml` has been created but needs to be added to the main branch:

**Option A: Create via Web Interface**
1. Go to `.github/workflows/` in the repository
2. Click **Add file** → **Create new file**
3. Name it: `deploy-pages.yml`
4. Copy the content from the local file
5. Commit directly to `main` branch

**Option B: Merge via Pull Request**
1. Create a PR from this branch to `main`
2. Review and merge the PR
3. Workflow will be activated automatically

### Step 3: Verify Deployment

After adding the workflow:
1. Push any change to `main` branch
2. Check **Actions** tab for build progress
3. Visit `https://[username].github.io/coding-challenges/`

## Workflow File Content

File: `.github/workflows/deploy-pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          # Install Python dependencies
          pip install -r .github/requirements.txt

      - name: Build site
        run: |
          chmod +x .github/scripts/build-site.sh
          .github/scripts/build-site.sh

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Testing Locally

Before deployment, test the build locally:

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

## What Gets Deployed

The deployment includes:

### Main Index (`/`)
- Filterable grid of all 94 challenges
- Stats (completed/in-progress/total)
- Links to GitHub and live demos
- Responsive card layout

### Interactive Viewers (`/[challenge]/`)
Web-based challenges get full interactive viewers:
- **47-chrome-extension**: Chrome Extension
- **76-video-chat-app**: Video Chat App
- **77-static-site-generator**: Static Site Generator
- **80-optical-character-recognition**: OCR Tool
- **82-markdown-to-pdf**: Markdown to PDF

Features:
- Split-pane view: docs + live app
- Sidebar navigation (README, challenge, implementation, examples, algorithms)
- Responsive mobile design
- Code copy buttons
- Auto-generated table of contents

### Documentation Pages (`/[challenge]/docs.html`)
All completed challenges get documentation pages with:
- Converted markdown content
- Syntax highlighting
- Formatted tables and lists
- Responsive layout

## URL Structure

```
https://encryptioner.github.io/coding-challenges/
├── /                                    # Main index
├── /82-markdown-to-pdf/                 # Interactive viewer
│   ├── index.html                       # Viewer entry point
│   ├── app.html                         # Live implementation
│   ├── README.html                      # Overview
│   ├── challenge.html                   # Requirements
│   └── docs/
│       ├── implementation.html
│       ├── examples.html
│       └── algorithms.html
├── /53-spell-checker-bloom-filter/
│   └── docs.html                        # Documentation only
└── /404.html                            # Custom 404
```

## Adding New Web Challenges

To deploy a new web-based challenge:

1. **Update build script** (`.github/scripts/build-site.sh`):
   ```bash
   declare -A WEB_CHALLENGES=(
     # ... existing ...
     ["NN-challenge-name"]="Display Name"
   )
   ```

2. **Ensure structure**:
   ```
   NN-challenge-name/
   ├── index.html           # Main app
   ├── README.md            # Documentation
   ├── challenge.md
   ├── docs/
   │   ├── implementation.md
   │   ├── examples.md
   │   └── algorithms.md
   └── static/              # Assets
   ```

3. **Commit and push** to `main` branch

## Troubleshooting

### Build Fails
- Check Python version: 3.11+
- Verify dependencies: `pip install -r .github/requirements.txt`
- Make scripts executable: `chmod +x .github/scripts/*.sh`

### Challenge Not Appearing
- Mark with ✓ in README.md
- Add to `WEB_CHALLENGES` in build script (for web demos)
- Check `index.html` exists

### Permissions Error
- Workflow files require special permissions
- Must be added via web interface or PR
- Cannot be pushed directly from automated tools

## Features

### Main Site
- Responsive design
- Challenge filtering (All, Completed, Web Apps, In Progress)
- GitHub and live demo links
- Modern gradient design
- Mobile-friendly

### Interactive Viewer
- Three view modes (Docs/App/Split)
- Resizable panes
- Mobile sidebar
- Navigation between docs
- Code copy buttons
- Table of contents
- Smooth scrolling

### Tech Stack
- Python 3.11 (markdown2, jinja2)
- Vanilla JavaScript
- CSS Grid/Flexbox
- GitHub Actions
- Static site generation

## Documentation

See `.github/pages/README.md` for detailed documentation on:
- Architecture
- Build process
- Customization
- Script usage

## Support

For issues or questions:
1. Check build logs in Actions tab
2. Test locally with build script
3. Verify file structure
4. Check GitHub Pages settings
