#!/bin/bash

# Script to generate placeholder icons for the Chrome extension
# Requires ImageMagick to be installed

set -e

ICONS_DIR="icons"
BG_COLOR="#04295B"  # Coding Challenges Blue
TEXT_COLOR="white"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Please install ImageMagick to generate icons:"
    echo "  - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  - macOS: brew install imagemagick"
    echo "  - Fedora: sudo dnf install imagemagick"
    echo ""
    echo "Alternatively, you can create your own icons manually."
    echo "Required sizes: 16x16, 48x48, 128x128"
    exit 1
fi

echo "Generating icons..."

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

# Generate 16x16 icon
convert -size 16x16 xc:"$BG_COLOR" \
    -gravity center \
    -pointsize 10 \
    -fill "$TEXT_COLOR" \
    -font "DejaVu-Sans-Bold" \
    -annotate +0+0 "CC" \
    "$ICONS_DIR/icon16.png"

# Generate 48x48 icon
convert -size 48x48 xc:"$BG_COLOR" \
    -gravity center \
    -pointsize 28 \
    -fill "$TEXT_COLOR" \
    -font "DejaVu-Sans-Bold" \
    -annotate +0+0 "CC" \
    "$ICONS_DIR/icon48.png"

# Generate 128x128 icon
convert -size 128x128 xc:"$BG_COLOR" \
    -gravity center \
    -pointsize 72 \
    -fill "$TEXT_COLOR" \
    -font "DejaVu-Sans-Bold" \
    -annotate +0+0 "CC" \
    "$ICONS_DIR/icon128.png"

echo "Icons generated successfully in $ICONS_DIR/"
echo "  - icon16.png (16x16)"
echo "  - icon48.png (48x48)"
echo "  - icon128.png (128x128)"
