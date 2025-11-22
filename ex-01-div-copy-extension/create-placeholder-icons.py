#!/usr/bin/env python3
"""
Create minimal placeholder icons for DivCopy extension
Creates very simple PNG files without requiring PIL/Pillow
"""

import struct
import zlib
import os

def create_simple_png(size, color_rgb=(76, 175, 80)):
    """Create a simple solid color PNG file"""
    width, height = size, size

    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk (image header)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = create_chunk(b'IHDR', ihdr_data)

    # IDAT chunk (image data)
    # Create raw image data (RGB, no alpha)
    raw_data = b''
    for y in range(height):
        # Filter type (0 = none)
        raw_data += b'\x00'
        # RGB pixels
        for x in range(width):
            raw_data += bytes(color_rgb)

    # Compress the data
    compressed = zlib.compress(raw_data, 9)
    idat = create_chunk(b'IDAT', compressed)

    # IEND chunk (end of file)
    iend = create_chunk(b'IEND', b'')

    # Combine all chunks
    png_data = png_signature + ihdr + idat + iend

    return png_data

def create_chunk(chunk_type, data):
    """Create a PNG chunk with CRC"""
    length = struct.pack('>I', len(data))
    crc = zlib.crc32(chunk_type + data) & 0xffffffff
    crc_bytes = struct.pack('>I', crc)
    return length + chunk_type + data + crc_bytes

def main():
    # Create icons directory
    icons_dir = "icons"
    os.makedirs(icons_dir, exist_ok=True)

    # Green color for DivCopy
    color = (76, 175, 80)  # #4CAF50

    sizes = [16, 48, 128]

    print("Creating placeholder icons for DivCopy extension...")

    for size in sizes:
        filename = os.path.join(icons_dir, f"icon{size}.png")
        print(f"  Creating {size}x{size} icon...")

        png_data = create_simple_png(size, color)

        with open(filename, 'wb') as f:
            f.write(png_data)

        print(f"  ✓ Saved: {filename}")

    print("\n✓ Placeholder icons created successfully!")
    print("\nNote: These are simple solid-color placeholders.")
    print("For better icons, install Pillow and run generate-icons.py:")
    print("  pip install Pillow")
    print("  python3 generate-icons.py")

if __name__ == "__main__":
    main()
