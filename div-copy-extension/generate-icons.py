#!/usr/bin/env python3
"""
DivCopy Icon Generator
Creates extension icons in multiple sizes
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("PIL/Pillow not installed. Install it with:")
    print("  pip install Pillow")
    exit(1)

# Configuration
BG_COLOR = (76, 175, 80)  # #4CAF50 green
ICON_TEXT = "📋"
SIZES = [16, 48, 128]

def create_icon(size):
    """Create an icon of specified size"""
    # Create image with background color
    img = Image.new('RGB', (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Add rounded corners by creating a mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = size // 5  # 20% radius for rounded corners
    mask_draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)

    # Apply mask
    output = Image.new('RGB', (size, size), (255, 255, 255))
    output.paste(img, (0, 0), mask)

    # Try to add emoji text (may not work on all systems)
    try:
        # Use a large font size relative to image size
        font_size = int(size * 0.6)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)

        # Draw white "DC" text (DivCopy) if emoji doesn't work
        text = "DC"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = (size - text_width) // 2
        y = (size - text_height) // 2 - bbox[1]

        draw = ImageDraw.Draw(output)
        draw.text((x, y), text, fill=(255, 255, 255), font=font)
    except:
        # Fallback: draw simple shapes
        padding = size // 4
        draw.rectangle(
            [padding, padding, size - padding, size - padding],
            fill=(255, 255, 255),
            outline=None
        )

    return output

def main():
    # Create icons directory
    icons_dir = "icons"
    os.makedirs(icons_dir, exist_ok=True)

    print("Generating DivCopy extension icons...")

    for size in SIZES:
        filename = f"{icons_dir}/icon{size}.png"
        print(f"Creating {size}x{size} icon...")

        icon = create_icon(size)
        icon.save(filename, "PNG")

        print(f"  ✓ Saved: {filename}")

    print("\n✓ All icons generated successfully!")
    print(f"\nGenerated files in '{icons_dir}/':")
    for size in SIZES:
        print(f"  - icon{size}.png")

if __name__ == "__main__":
    main()
