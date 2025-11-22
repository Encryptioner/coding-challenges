# GitHub Pages Deployment Guide

This repository is ready to be deployed to GitHub Pages with an interactive documentation viewer for all coding challenges.

## 🚀 Quick Deployment

### Option 1: Automated Setup Script (Recommended)

Run the deployment setup script:

```bash
./deploy-github-pages.sh
```

This script will:
- ✅ Verify all required files are present
- ✅ Test the build process locally
- ✅ Generate the static site in `dist/`
- ✅ Provide step-by-step deployment instructions
- ✅ Optionally start a local preview server

### Option 2: Manual Deployment

#### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the configuration

#### Step 2: Add Workflow File

The workflow file must be manually added to `.github/workflows/` on the main branch:

**Method A: GitHub Web Interface**
```
1. Go to your repository on GitHub
2. Navigate to .github/workflows/ (create directory if needed)
3. Click "Add file" → "Create new file"
4. Name it: deploy-pages.yml
5. Copy content from: .github/workflow-templates/deploy-pages.yml
6. Commit directly to main/master branch
```

**Method B: Command Line (if you have permissions)**
```bash
# On main/master branch
mkdir -p .github/workflows
cp .github/workflow-templates/deploy-pages.yml .github/workflows/
git add .github/workflows/deploy-pages.yml
git commit -m "feat: add GitHub Pages deployment workflow"
git push origin main  # or master
```

#### Step 3: Verify Deployment

1. Push any change to main/master branch
2. Go to **Actions** tab on GitHub
3. Watch the deployment build and deploy
4. Visit `https://[username].github.io/coding-challenges/`

## 🎯 What Gets Deployed

### Main Index Page (`/`)
- **Filterable challenge grid**: All 94 challenges
- **Filter options**: All, Completed, Web Apps, In Progress
- **Stats dashboard**: Progress tracking
- **Direct links**: GitHub code and live demos

### Interactive Documentation Viewers

Web-based challenges get full interactive viewers with:

**Deployed Challenges:**
- **#47** Chrome Extension
- **#76** Video Chat App
- **#77** Static Site Generator
- **#80** Optical Character Recognition
- **#82** Markdown to PDF

**Features:**
- 📖 Split-pane layout (docs + live app)
- 🎮 Three view modes (Docs/App/Split)
- 📱 Mobile responsive design
- 🔍 Sidebar navigation
- 📋 One-click code copying
- 📚 Auto-generated table of contents
- ↔️ Resizable panes

### Documentation Pages

All completed challenges include:
- Converted markdown documentation
- Syntax highlighting
- Responsive layout
- Navigation between docs

## 🧪 Local Testing

Test the deployment locally before pushing:

```bash
# Install dependencies
pip install -r .github/requirements.txt

# Build site
.github/scripts/build-site.sh

# Preview locally
cd dist
python3 -m http.server 8000

# Visit http://localhost:8000
```

Or use the automated script:

```bash
./deploy-github-pages.sh
```

## 📁 URL Structure

Once deployed, the site structure will be:

```
https://[username].github.io/coding-challenges/
│
├── /                                    # Main index (filterable grid)
│
├── /82-markdown-to-pdf/                 # Interactive viewer
│   ├── index.html                       # Viewer with split panes
│   ├── app.html                         # Live implementation
│   ├── README.html                      # Overview documentation
│   ├── challenge.html                   # Challenge description
│   └── docs/
│       ├── implementation.html          # Implementation guide
│       ├── examples.html                # Usage examples
│       └── algorithms.html              # Algorithm deep dive
│
├── /53-spell-checker-bloom-filter/
│   └── docs.html                        # Documentation page
│
└── /404.html                            # Custom 404 page
```

## 🔧 Adding New Web Challenges

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
   ├── index.html              # Main app (required for live demo)
   ├── README.md               # Overview (required)
   ├── challenge.md            # Challenge description (optional)
   ├── docs/                   # Tutorial docs (optional)
   │   ├── implementation.md
   │   ├── examples.md
   │   └── algorithms.md
   └── static/                 # Assets (auto-copied)
   ```

3. **Mark as completed** in root `README.md`:
   ```markdown
   NN. [Challenge Name](./NN-challenge-name) - Description ✓
   ```

4. **Commit and push** to main/master branch

The workflow will automatically rebuild and deploy the updated site.

## 🛠️ Build System

### Components

**Scripts** (`.github/scripts/`)
- `build-site.sh` - Main orchestrator
- `generate-index.py` - Creates main index from README.md
- `generate-interactive-viewer.py` - Builds split-pane viewers
- `generate-docs-pages.py` - Converts markdown to HTML
- `generate-challenge-page.py` - Generates landing pages

**Assets** (`.github/pages/assets/`)
- `style.css` - Main site styling
- `docs.css` - Interactive viewer styles
- `script.js` - Challenge filtering
- `docs-viewer.js` - Split-pane functionality

**Configuration**
- `.github/requirements.txt` - Python dependencies
- `.github/workflow-templates/deploy-pages.yml` - CI/CD workflow
- `.github/pages/404.html` - Custom 404 page

### Build Process

1. **Generate Index**: Parse README.md, create filterable grid
2. **Process Web Challenges**: Create interactive viewers
3. **Convert Documentation**: Markdown → HTML for all challenges
4. **Copy Assets**: Static files, CSS, JavaScript
5. **Create Distribution**: Everything in `dist/` directory

## 🐛 Troubleshooting

### Build Fails

**Check Python version:**
```bash
python3 --version  # Should be 3.11+
```

**Install dependencies:**
```bash
pip install -r .github/requirements.txt
```

**Test build locally:**
```bash
./deploy-github-pages.sh
```

**Check logs:**
```bash
.github/scripts/build-site.sh 2>&1 | tee build.log
```

### Workflow Not Running

- Verify GitHub Pages is enabled (Settings → Pages)
- Check Source is set to "GitHub Actions"
- Ensure workflow file is on main/master branch
- Check Actions tab for error messages

### Challenge Not Appearing

- Add to `WEB_CHALLENGES` in build script (for live demos)
- Ensure `index.html` exists (for web demos)
- Verify challenge folder naming matches README.md

### 404 Errors

- Check `.nojekyll` file exists in dist/
- Verify challenge folders are named correctly
- Ensure index.html is generated
- Check browser console for errors

### Local Build Works But Deployment Fails

- Check GitHub Actions logs
- Verify dependencies in `.github/requirements.txt`
- Ensure scripts are executable (`chmod +x`)
- Check file paths are relative, not absolute

## 📚 Documentation

Detailed documentation available:

- **Setup Guide**: `.github/GITHUB_PAGES_SETUP.md`
- **Workflow Info**: `.github/workflow-templates/README.md`
- **Technical Docs**: `.github/pages/README.md`
- **This File**: `DEPLOYMENT.md`

## 🎨 Customization

### Styling

Edit these files to customize appearance:
- `.github/pages/assets/style.css` - Main site colors, layout
- `.github/pages/assets/docs.css` - Interactive viewer styles

### Features

Edit these files to add functionality:
- `.github/pages/assets/script.js` - Challenge filtering
- `.github/pages/assets/docs-viewer.js` - Viewer interactivity

### Build Process

Modify build scripts:
- `.github/scripts/build-site.sh` - Add new challenge types
- `.github/scripts/generate-index.py` - Customize index layout
- `.github/scripts/generate-interactive-viewer.py` - Modify viewer

## 📝 Requirements

**Local Development:**
- Python 3.11+
- pip (Python package manager)
- Git

**GitHub:**
- Repository with Pages enabled
- GitHub Actions workflow file
- Permissions to deploy

**Dependencies:**
- markdown2 (Python markdown converter)
- jinja2 (Python templating engine)

## 🔒 Security

The deployment:
- ✅ Uses GitHub Actions (secure CI/CD)
- ✅ Static files only (no server-side code)
- ✅ No secrets or credentials required
- ✅ Read-only artifact uploads
- ✅ Sandboxed build environment

## 📊 Performance

**Build Time:**
- ~30-60 seconds for full build
- Depends on number of challenges
- Cached dependencies speed up builds

**Site Performance:**
- Static HTML/CSS/JS (fast loading)
- No database queries
- Minimal JavaScript
- Optimized assets

## 🤝 Contributing

When adding new challenges:
1. Follow the challenge structure guidelines
2. Test build locally with `./deploy-github-pages.sh`
3. Update README.md with ✓ when complete
4. Add to `WEB_CHALLENGES` if has web demo
5. Commit and push to main/master

## 📄 License

Educational implementations for CodingChallenges.fyi.

---

**Ready to deploy?** Run `./deploy-github-pages.sh` to get started! 🚀
