#!/bin/bash

# GitHub Pages Deployment Setup Script
# This script prepares the repository for GitHub Pages deployment

set -e

echo "🚀 GitHub Pages Deployment Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

echo "📋 Deployment Checklist:"
echo ""

# 1. Check if GitHub Pages assets exist
echo -n "1. Checking GitHub Pages assets... "
if [ -d ".github/pages" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Missing .github/pages directory"
    exit 1
fi

# 2. Check if build scripts exist
echo -n "2. Checking build scripts... "
if [ -f ".github/scripts/build-site.sh" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Missing build scripts"
    exit 1
fi

# 3. Check if workflow template exists
echo -n "3. Checking workflow template... "
if [ -f ".github/workflow-templates/deploy-pages.yml" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Missing workflow template"
    exit 1
fi

# 4. Test build locally
echo -n "4. Testing local build... "
if bash .github/scripts/build-site.sh > /tmp/build-test.log 2>&1; then
    echo -e "${GREEN}✓${NC}"
    echo "   Build successful! Site generated in dist/"
else
    echo -e "${RED}✗${NC}"
    echo "   Build failed. Check /tmp/build-test.log for details"
    exit 1
fi

# 5. Check if dist directory was created
echo -n "5. Verifying build output... "
if [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✓${NC}"

    # Count generated files
    file_count=$(find dist -type f | wc -l)
    dir_count=$(find dist -type d | wc -l)
    echo "   Generated: $file_count files in $dir_count directories"
else
    echo -e "${RED}✗${NC}"
    echo "   Build output incomplete"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "📝 Next Steps for GitHub Deployment:"
echo ""
echo "1. Enable GitHub Pages:"
echo "   • Go to Settings → Pages"
echo "   • Set Source to 'GitHub Actions'"
echo ""
echo "2. Add Workflow File (choose one method):"
echo ""
echo "   ${YELLOW}Method A: Via GitHub Web Interface${NC}"
echo "   • Go to .github/workflows/ on GitHub"
echo "   • Click 'Add file' → 'Create new file'"
echo "   • Name: deploy-pages.yml"
echo "   • Copy content from: .github/workflow-templates/deploy-pages.yml"
echo "   • Commit to main/master branch"
echo ""
echo "   ${YELLOW}Method B: Via Pull Request${NC}"
echo "   • Create PR from current branch to main/master"
echo "   • Workflow file will be reviewed and merged"
echo ""
echo "   ${YELLOW}Method C: Manual Copy (if you have write access)${NC}"
echo "   • Run: mkdir -p .github/workflows"
echo "   • Run: cp .github/workflow-templates/deploy-pages.yml .github/workflows/"
echo "   • Commit and push to main/master branch"
echo ""
echo "3. After workflow is added:"
echo "   • Push any change to trigger deployment"
echo "   • Check Actions tab for build status"
echo "   • Visit: https://[username].github.io/coding-challenges/"
echo ""
echo "📚 Documentation:"
echo "   • Setup Guide: .github/GITHUB_PAGES_SETUP.md"
echo "   • Workflow Info: .github/workflow-templates/README.md"
echo "   • Technical Docs: .github/pages/README.md"
echo ""
echo "🎉 Local preview available at: file://$(pwd)/dist/index.html"
echo ""

# Ask if user wants to preview
read -p "Would you like to start a local server to preview the site? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting local server on http://localhost:8000..."
    echo "Press Ctrl+C to stop"
    echo ""
    cd dist && python3 -m http.server 8000
fi
