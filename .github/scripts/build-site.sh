#!/bin/bash

set -e

echo "Building GitHub Pages site..."

# Create dist directory
DIST_DIR="dist"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Function to detect and run build for a web challenge
build_web_app() {
  local challenge_dir=$1
  local challenge_name=$2

  # Skip if no package.json
  if [ ! -f "$challenge_dir/package.json" ]; then
    return 0
  fi

  echo "  Building web app for $challenge_name..."

  # Detect package manager
  local pkg_manager="npm"
  if [ -f "$challenge_dir/pnpm-lock.yaml" ]; then
    pkg_manager="pnpm"
  elif [ -f "$challenge_dir/yarn.lock" ]; then
    pkg_manager="yarn"
  fi

  # Save current directory
  local current_dir=$(pwd)

  # Navigate to challenge directory
  cd "$challenge_dir"

  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    echo "    Installing dependencies with $pkg_manager..."
    $pkg_manager install
  fi

  # Check if build script exists
  if grep -q '"build"' package.json 2>/dev/null; then
    echo "    Running build..."
    $pkg_manager run build
  else
    echo "    No build script found, skipping..."
  fi

  # Return to original directory
  cd "$current_dir"
  return 0
}

# Function to copy web app files to dist
copy_web_app_files() {
  local challenge_dir=$1
  local output_dir=$2

  # If there's a built dist directory, copy from there
  if [ -d "$challenge_dir/dist" ]; then
    echo "    Copying built files from dist/..."
    cp -r "$challenge_dir/dist/"* "$output_dir/"

    # Rename index.html to app.html if it exists
    if [ -f "$output_dir/index.html" ]; then
      mv "$output_dir/index.html" "$output_dir/app.html"
    fi
    return 0
  fi

  # If there's a build directory, copy from there
  if [ -d "$challenge_dir/build" ]; then
    echo "    Copying built files from build/..."
    cp -r "$challenge_dir/build/"* "$output_dir/"

    # Rename index.html to app.html if it exists
    if [ -f "$output_dir/index.html" ]; then
      mv "$output_dir/index.html" "$output_dir/app.html"
    fi
    return 0
  fi

  # Otherwise copy index.html and assets from source
  if [ -f "$challenge_dir/index.html" ]; then
    echo "    Copying source files..."
    cp "$challenge_dir/index.html" "$output_dir/app.html"

    # Copy static assets
    for asset_dir in static css js images assets; do
      if [ -d "$challenge_dir/$asset_dir" ]; then
        cp -r "$challenge_dir/$asset_dir" "$output_dir/"
      fi
    done
    return 0
  fi

  return 1
}

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

      # Build the web app if it has a build process
      build_web_app "$challenge_dir" "$challenge_name"

      # Generate interactive documentation viewer
      python3 .github/scripts/generate-interactive-viewer.py "$challenge_dir" "$challenge_name"

      # Copy built web app files
      output_dir="$DIST_DIR/$challenge_dir"
      if copy_web_app_files "$challenge_dir" "$output_dir"; then
        echo "    ✓ Web app files copied"
      else
        echo "    ! No web app files to copy"
      fi
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
