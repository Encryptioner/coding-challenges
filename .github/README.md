# GitHub Configuration

GitHub Pages deployment configuration and assets.

## Quick Links

- **Setup Guide**: [../DOCS/deployment/SETUP.md](../DOCS/deployment/SETUP.md)
- **Workflow Reference**: [../DOCS/deployment/WORKFLOW.md](../DOCS/deployment/WORKFLOW.md)
- **Complete Guide**: [../DOCS/deployment/DEPLOYMENT.md](../DOCS/deployment/DEPLOYMENT.md)

## Directory Structure

```
.github/
├── scripts/                    # Build scripts
│   ├── build-site.sh           # Main build orchestrator
│   ├── generate-index.py       # Creates main index
│   ├── generate-interactive-viewer.py  # Builds split-pane viewers
│   └── generate-docs-pages.py  # Converts markdown to HTML
├── pages/                      # Static assets
│   ├── assets/                 # CSS, JavaScript
│   └── 404.html                # Custom 404 page
├── workflow-templates/         # GitHub Actions templates
│   └── deploy-pages.yml        # Auto-deployment workflow
└── requirements.txt            # Python dependencies
```

## Build System

### How It Works

1. **Trigger**: Push to main branch
2. **Build**: Run `build-site.sh` script
3. **Generate**: Create static site in `dist/`
4. **Deploy**: Upload to GitHub Pages

### Scripts

- **build-site.sh**: Main orchestrator that coordinates all generators
- **generate-index.py**: Creates main index page from README.md
- **generate-interactive-viewer.py**: Builds split-pane viewers for web challenges
- **generate-docs-pages.py**: Converts all markdown documentation to HTML

### Assets

Located in `pages/assets/`:
- **style.css**: Main site styling
- **docs.css**: Interactive viewer styles
- **script.js**: Challenge filtering logic
- **docs-viewer.js**: Split-pane functionality

## Workflow Setup

The workflow file must be manually added to activate auto-deployment:

**Copy**: `.github/workflow-templates/deploy-pages.yml`
**To**: `.github/workflows/deploy-pages.yml`

See [SETUP.md](../DOCS/deployment/SETUP.md) for detailed instructions.

## Web Challenges

Add to `INDEX.md` file's `Web-Deployable Challenges` section after completion

## Local Testing

```bash
# Install dependencies
pip install -r .github/requirements.txt

# Build site
.github/scripts/build-site.sh

# Preview
cd dist && python3 -m http.server 8000
```

## Documentation

For complete setup and usage:
- Start: [SETUP.md](../DOCS/deployment/SETUP.md)
- Daily use: [WORKFLOW.md](../DOCS/deployment/WORKFLOW.md)
- Advanced: [DEPLOYMENT.md](../DOCS/deployment/DEPLOYMENT.md)
