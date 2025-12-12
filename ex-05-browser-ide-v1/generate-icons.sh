#!/bin/bash
# Simple icon generator using ImageMagick
# This creates placeholder icons - replace with your actual icons

echo "Creating placeholder PWA icons..."

# Create a simple SVG icon
cat > public/icon.svg << 'SVGEOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#007acc"/>
  <text x="50%" y="50%" font-size="200" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial">
    IDE
  </text>
</svg>
SVGEOF

echo "✅ Icon created at public/icon.svg"
echo ""
echo "To generate PNG icons, install ImageMagick and run:"
echo "  convert public/icon.svg -resize 192x192 public/icons/icon-192x192.png"
echo "  convert public/icon.svg -resize 512x512 public/icons/icon-512x512.png"
echo ""
echo "Or use an online tool like https://realfavicongenerator.net/"
