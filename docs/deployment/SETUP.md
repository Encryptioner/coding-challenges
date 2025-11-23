# GitHub Pages Setup

## Current Status: NOT ACTIVE ❌

Auto-deployment is configured but not activated.

## What Activation Does

**Before**: Push to master → Nothing happens (manual deployment required)

**After**: Push to master → Auto-builds → Auto-deploys → Site updates (zero manual work)

## Activation Steps

### 1. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Set **Source** to **GitHub Actions**
3. Click **Save**

### 2. Add Workflow File

**Method A: GitHub Web (Easiest)**
1. Go to repo on GitHub
2. Switch to `master` branch
3. Navigate to `.github/workflows/` (create if needed)
4. Click "Add file" → "Create new file"
5. Name: `deploy-pages.yml`
6. Copy content from: `.github/workflow-templates/deploy-pages.yml`
7. Commit to master

**Method B: Command Line**
```bash
# On master branch
mkdir -p .github/workflows
cp .github/workflow-templates/deploy-pages.yml .github/workflows/
git add .github/workflows/deploy-pages.yml
git commit -m "feat: activate auto-deployment"
git push origin master
```

### 3. Verify

1. Check **Actions** tab on GitHub
2. Should see "Deploy to GitHub Pages" workflow running
3. Visit `https://[username].github.io/coding-challenges/` after 1-2 minutes

## What Gets Deployed

Every push to `master` auto-deploys:
- Main index (filterable grid of all challenges)
- Interactive viewers (5 web challenges with docs + live demos)
- Documentation (all challenge docs converted to HTML)
- Assets (CSS, JS, images)

## Testing

**Before activation** (local test):
```bash
# Install dependencies in virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r .github/requirements.txt

# Run test
./DOCS/deployment/deploy-github-pages.sh
```

**After activation** (verify auto-deploy):
```bash
git commit --allow-empty -m "test: verify auto-deployment"
git push origin master
# Check Actions tab
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow not running | Ensure workflow file is on master branch |
| Build fails | Check Actions logs, verify Python 3.11+ |
| Site shows 404 | Wait 2-3 minutes, check Pages is enabled |

## Quick Reference

```bash
# Setup virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r .github/requirements.txt

# Test deployment locally
./DOCS/deployment/deploy-github-pages.sh

# View workflow guide
cat DOCS/deployment/WORKFLOW.md

# Enable auto-deploy (interactive guide)
./DOCS/deployment/enable-auto-deploy.sh
```

---

**Next Step**: See [WORKFLOW.md](./WORKFLOW.md) for daily workflow guide 📚
