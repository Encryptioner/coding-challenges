#!/bin/bash

# DivCopy Icon Generator
# Requires ImageMagick to be installed

if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p icons

# Colors
BG_COLOR="#4CAF50"
TEXT_COLOR="white"

echo "Generating DivCopy extension icons..."

# Generate SVG template
cat > icons/icon_template.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#4CAF50" rx="80"/>
  <text x="256" y="350" font-family="Arial, sans-serif" font-size="300" fill="white" text-anchor="middle">📋</text>
</svg>
EOF

# Convert SVG to PNG at different sizes
for size in 16 48 128; do
    echo "Creating ${size}x${size} icon..."
    convert -background none -resize ${size}x${size} icons/icon_template.svg icons/icon${size}.png
done

echo "✓ Icons generated successfully!"
echo ""
echo "Generated files:"
ls -lh icons/icon*.png

# Clean up SVG template
rm icons/icon_template.svg

echo ""
echo "Icons are ready for use!"
