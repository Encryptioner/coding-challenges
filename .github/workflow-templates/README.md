# GitHub Workflow Templates

This directory contains GitHub Actions workflow file templates for automated deployment.

## ⚠️ Important: Manual Setup Required

Due to security restrictions, workflow files in `.github/workflows/` **cannot be pushed directly** from automated tools. The workflow file provided here must be manually copied to `.github/workflows/` via one of these methods:

### Method 1: GitHub Web Interface (Recommended)

1. Go to your repository on GitHub
2. Navigate to `.github/workflows/`
3. Click **Add file** → **Create new file**
4. Name it: `deploy-pages.yml`
5. Copy the content from `deploy-pages.yml` in this directory
6. Commit directly to the `main` branch

### Method 2: Pull Request

1. Create a Pull Request from this branch to `main`
2. The workflow file will be included in the PR
3. Merge the PR to activate the workflow

## Workflow File

File: `deploy-pages.yml`

This workflow automatically builds and deploys the GitHub Pages site when changes are pushed to the `main` branch.

**Features:**
- Triggers on push to `main` branch
- Can be manually triggered via workflow_dispatch
- Builds static site from markdown documentation
- Deploys to GitHub Pages
- Uses Python 3.11 and Node.js 20

**Required Permissions:**
- `contents: read` - Read repository files
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - Authentication

For complete setup instructions, see:
- `.github/GITHUB_PAGES_SETUP.md` - Detailed setup guide
- `.github/pages/README.md` - Technical documentation

## After Setup

Once the workflow is added:
1. Push any change to `main` branch
2. Check the **Actions** tab for deployment status
3. Visit `https://[username].github.io/coding-challenges/`

## Troubleshooting

**Workflow not running?**
- Verify GitHub Pages is enabled in Settings → Pages
- Check that Source is set to "GitHub Actions"
- Ensure workflow file is in `main` branch

**Build failing?**
- Check Actions logs for errors
- Test locally with `.github/scripts/build-site.sh`
- Verify Python dependencies are installed

**404 errors?**
- Check `.nojekyll` file is present in dist/
- Verify challenge folders are named correctly
- Ensure index.html is generated
