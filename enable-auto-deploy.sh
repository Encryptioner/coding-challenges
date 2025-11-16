#!/bin/bash

# Enable Auto-Deployment for GitHub Pages
# This script guides you through activating automatic deployment

set -e

cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║     GitHub Pages Auto-Deployment Activation Guide            ║
╔══════════════════════════════════════════════════════════════╝

This script will help you enable automatic deployment to GitHub Pages.
Once configured, ANY push to the 'master' branch will automatically:
  ✓ Build the static site
  ✓ Deploy to GitHub Pages
  ✓ Update https://[username].github.io/coding-challenges/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Enable GitHub Pages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to: https://github.com/[your-username]/coding-challenges/settings/pages
2. Under "Build and deployment":
   • Source: Select "GitHub Actions"
3. Click "Save"

✓ This enables GitHub Pages with GitHub Actions as the deployment source.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2: Add Workflow File
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The workflow file must be added to the 'master' branch.

Choose ONE of these methods:

┌────────────────────────────────────────────────────────────┐
│ METHOD A: GitHub Web Interface (Easiest)                  │
└────────────────────────────────────────────────────────────┘

1. Go to your repository on GitHub
2. Switch to 'master' branch
3. Navigate to: .github/workflows/
   (Create the 'workflows' folder if it doesn't exist)
4. Click: "Add file" → "Create new file"
5. File name: deploy-pages.yml
6. Copy content from: .github/workflow-templates/deploy-pages.yml
7. Commit directly to master branch

┌────────────────────────────────────────────────────────────┐
│ METHOD B: Command Line (If you have direct access)        │
└────────────────────────────────────────────────────────────┘

On the master branch, run:

  mkdir -p .github/workflows
  cp .github/workflow-templates/deploy-pages.yml .github/workflows/
  git add .github/workflows/deploy-pages.yml
  git commit -m "feat: activate GitHub Pages auto-deployment"
  git push origin master

┌────────────────────────────────────────────────────────────┐
│ METHOD C: Via Pull Request                                │
└────────────────────────────────────────────────────────────┘

1. Create a Pull Request from this branch to master
2. The workflow file will be included
3. Merge the PR
4. Auto-deployment activates immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3: Verify Auto-Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After adding the workflow file:

1. Make any change on master branch (e.g., update README.md)
2. Push to master:
   git push origin master

3. Check deployment status:
   • Go to: Actions tab on GitHub
   • You should see "Deploy to GitHub Pages" workflow running
   • Wait 1-2 minutes for build to complete

4. Visit your site:
   https://[username].github.io/coding-challenges/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What Gets Auto-Deployed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every push to master will deploy:

✓ Main index page (filterable challenge grid)
✓ Interactive documentation viewers for web challenges:
  • #47 Chrome Extension
  • #76 Video Chat App
  • #77 Static Site Generator
  • #80 OCR Tool
  • #82 Markdown to PDF

✓ Documentation pages for all 13 completed challenges
✓ Custom 404 page
✓ All CSS, JavaScript, and assets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Workflow Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Trigger: Push to 'master' branch
Build: Python 3.11 + Node.js 20
Process:
  1. Checkout code
  2. Install dependencies (markdown2, jinja2)
  3. Run build script (.github/scripts/build-site.sh)
  4. Generate static site in dist/
  5. Deploy to GitHub Pages

Build Time: ~30-60 seconds
Deployment: Immediate after build

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Troubleshooting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Workflow not running?
   → Check workflow file is in .github/workflows/ on master
   → Verify branch name is 'master' in workflow file
   → Check GitHub Pages is enabled (Settings → Pages)

❌ Build failing?
   → Check Actions tab for error logs
   → Test locally: ./deploy-github-pages.sh
   → Verify Python 3.11+ is available in workflow

❌ 404 errors on deployed site?
   → Wait 2-3 minutes for initial deployment
   → Check .nojekyll file is generated
   → Verify dist/ contains index.html

❌ Changes not appearing?
   → Clear browser cache
   → Wait for workflow to complete (check Actions tab)
   → Check workflow triggered (should run on every push to master)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary: How Auto-Deployment Will Work
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Once activated:

  You push to master → GitHub Actions workflow triggers
                    → Runs build script
                    → Generates static site
                    → Deploys to GitHub Pages
                    → Site updates automatically

NO manual deployment needed ever again! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready to Activate?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Follow the steps above to enable auto-deployment.

For detailed documentation, see:
  • DEPLOYMENT.md (complete guide)
  • .github/GITHUB_PAGES_SETUP.md (setup instructions)
  • .github/workflow-templates/README.md (workflow details)

EOF

echo ""
read -p "Press Enter to continue..."
