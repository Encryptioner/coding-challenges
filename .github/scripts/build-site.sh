#!/bin/bash

set -e

echo "Building GitHub Pages site..."

# Create dist directory
DIST_DIR="dist"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy static assets
mkdir -p "$DIST_DIR/assets"
cp -r .github/pages/assets/* "$DIST_DIR/assets/" 2>/dev/null || true

# Copy 404 page
cp .github/pages/404.html "$DIST_DIR/" 2>/dev/null || true

# Create .nojekyll file (disable Jekyll processing)
touch "$DIST_DIR/.nojekyll"

# Generate main index page
echo "Generating main index page..."
python3 .github/scripts/generate-index.py

# Web-based challenges to deploy
declare -A WEB_CHALLENGES=(
  ["47-chrome-extension"]="Chrome Extension"
  ["69-notion/demo"]="Notion Clone"
  ["76-video-chat-app"]="Video Chat App"
  ["77-static-site-generator"]="Static Site Generator"
  ["80-optical-character-recognition"]="OCR Tool"
  ["82-markdown-to-pdf"]="Markdown to PDF"
)

# Deploy web-based challenges with interactive viewer
echo "Deploying web-based challenges..."
for challenge_dir in "${!WEB_CHALLENGES[@]}"; do
  if [ -d "$challenge_dir" ]; then
    echo "  - Deploying $challenge_dir..."

    # Generate interactive documentation viewer
    python3 .github/scripts/generate-interactive-viewer.py "$challenge_dir" "${WEB_CHALLENGES[$challenge_dir]}"
  fi
done

# Generate documentation pages for all challenges
echo "Generating documentation pages..."
python3 .github/scripts/generate-docs-pages.py

# Copy README as fallback
cp README.md "$DIST_DIR/" 2>/dev/null || true

echo "Build complete! Site generated in $DIST_DIR/"
