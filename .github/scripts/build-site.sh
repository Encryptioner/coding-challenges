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

# Copy favicon
cp .github/pages/favicon.svg "$DIST_DIR/" 2>/dev/null || true

# Create .nojekyll file (disable Jekyll processing)
touch "$DIST_DIR/.nojekyll"

# Generate main index page
echo "Generating main index page..."
python3 .github/scripts/generate-index.py

# Extract web-deployable challenges from INDEX.md
echo "Extracting web-deployable challenges from INDEX.md..."
WEB_CHALLENGE_FOLDERS=$(python3 .github/scripts/extract-web-challenges.py)

if [ -z "$WEB_CHALLENGE_FOLDERS" ]; then
  echo "  ! No web challenges found in INDEX.md"
else
  # Deploy web-based challenges with interactive viewer
  echo "Deploying web-based challenges..."
  for challenge_dir in $WEB_CHALLENGE_FOLDERS; do
    if [ -d "$challenge_dir" ]; then
      # Extract challenge name from folder (e.g., "47-chrome-extension" -> "Chrome Extension")
      challenge_name=$(echo "$challenge_dir" | sed 's/^[0-9]*-//' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1')

      echo "  - Deploying $challenge_dir ($challenge_name)..."

      # Generate interactive documentation viewer
      python3 .github/scripts/generate-interactive-viewer.py "$challenge_dir" "$challenge_name"
    else
      echo "  ! Directory not found: $challenge_dir"
    fi
  done
fi

# Generate documentation pages for all challenges
echo "Generating documentation pages..."
python3 .github/scripts/generate-docs-pages.py

# Copy README as fallback
cp README.md "$DIST_DIR/" 2>/dev/null || true

echo "Build complete! Site generated in $DIST_DIR/"
