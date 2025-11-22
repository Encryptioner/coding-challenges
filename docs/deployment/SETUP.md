# GitHub Pages Setup

## Current Status: NOT ACTIVE ❌

Auto-deployment is configured but not activated.

## What Activation Does

**Before**: Push to main → Nothing happens (manual deployment required)

**After**: Push to main → Auto-builds → Auto-deploys → Site updates (zero manual work)

## Activation Steps

### 1. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Set **Source** to **GitHub Actions**
3. Click **Save**

### 2. Add Workflow File

**Method A: GitHub Web (Easiest)**
1. Go to repo on GitHub
2. Switch to `main` branch
3. Navigate to `.github/workflows/` (create if needed)
4. Click "Add file" → "Create new file"
5. Name: `deploy-pages.yml`
6. Copy content from: `.github/workflow-templates/deploy-pages.yml`
7. Commit to main

**Method B: Command Line**
```bash
# On main branch
mkdir -p .github/workflows
cp .github/workflow-templates/deploy-pages.yml .github/workflows/
git add .github/workflows/deploy-pages.yml
git commit -m "feat: activate auto-deployment"
git push origin main
```

### 3. Verify

1. Check **Actions** tab on GitHub
2. Should see "Deploy to GitHub Pages" workflow running
3. Visit `https://[username].github.io/coding-challenges/` after 1-2 minutes

## What Gets Deployed

Every push to `main` auto-deploys:
- Main index (filterable grid of all challenges)
- Interactive viewers (5 web challenges with docs + live demos)
- Documentation (all challenge docs converted to HTML)
- Assets (CSS, JS, images)

## Testing

**Before activation** (local test):
```bash
./DOCS/deployment/deploy-github-pages.sh
```

**After activation** (verify auto-deploy):
```bash
git commit --allow-empty -m "test: verify auto-deployment"
git push origin main
# Check Actions tab
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow not running | Ensure workflow file is on main branch |
| Build fails | Check Actions logs, verify Python 3.11+ |
| Site shows 404 | Wait 2-3 minutes, check Pages is enabled |

## Quick Reference

```bash
# Test deployment locally
./DOCS/deployment/deploy-github-pages.sh

# View workflow guide
cat DOCS/deployment/WORKFLOW.md

# Enable auto-deploy (interactive guide)
./DOCS/deployment/enable-auto-deploy.sh
```

---

**Next Step**: See [WORKFLOW.md](./WORKFLOW.md) for daily workflow guide 📚
