#!/usr/bin/env python3
"""
Optical Character Recognition (OCR) Tool
A command-line tool for detecting and extracting text from images.
"""

import argparse
import json
import sys
import os
from pathlib import Path

try:
    import cv2
    import numpy as np
    from PIL import Image
    import pytesseract
except ImportError as e:
    print(f"Error: Missing required dependency: {e}")
    print("Please install dependencies: pip install -r requirements.txt")
    print("\nNote: You also need to install Tesseract OCR:")
    print("  - macOS: brew install tesseract")
    print("  - Ubuntu/Debian: sudo apt-get install tesseract-ocr")
    print("  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki")
    sys.exit(1)


class OCREngine:
    """Main OCR engine for text detection and recognition."""

    def __init__(self, debug=False):
        self.debug = debug

    def load_image(self, image_path):
        """Load an image from file."""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        # Load with OpenCV
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")

        if self.debug:
            print(f"Loaded image: {image.shape[1]}x{image.shape[0]} pixels")

        return image

    def detect_text(self, image):
        """
        Detect whether the image contains text.
        Returns: (has_text: bool, confidence: float)
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply edge detection
        edges = cv2.Canny(gray, 50, 150)

        # Apply morphological operations to connect text components
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        dilated = cv2.dilate(edges, kernel, iterations=1)

        # Find contours
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Filter contours that look like text regions
        text_contours = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / float(h) if h > 0 else 0
            area = cv2.contourArea(contour)

            # Text regions typically have certain aspect ratios and sizes
            if 0.2 < aspect_ratio < 10 and area > 50:
                text_contours.append(contour)

        has_text = len(text_contours) > 0
        confidence = min(len(text_contours) / 10.0, 1.0)  # Rough confidence estimate

        if self.debug:
            print(f"Found {len(text_contours)} potential text regions")

        return has_text, confidence

    def find_character_bounds(self, image):
        """
        Find bounding boxes around characters and text regions.
        Returns: list of (x, y, w, h) tuples
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply adaptive thresholding for better text separation
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 11, 2
        )

        # Apply morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        dilated = cv2.dilate(thresh, kernel, iterations=1)

        # Find contours
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Extract bounding boxes
        bounds = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            area = w * h

            # Filter out noise (too small) and non-text regions (too large or wrong aspect ratio)
            if area > 20 and w > 2 and h > 2:
                aspect_ratio = w / float(h)
                if 0.1 < aspect_ratio < 10:  # Reasonable aspect ratio for characters
                    bounds.append((x, y, w, h))

        # Sort bounds by position (top to bottom, left to right)
        bounds.sort(key=lambda b: (b[1], b[0]))

        if self.debug:
            print(f"Found {len(bounds)} character/text regions")

        return bounds

    def draw_bounds(self, image, bounds, output_path):
        """Draw bounding boxes on image and save."""
        annotated = image.copy()

        for x, y, w, h in bounds:
            cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 255, 0), 2)

        cv2.imwrite(output_path, annotated)

        if self.debug:
            print(f"Saved annotated image to: {output_path}")

    def extract_text(self, image, lang='eng'):
        """
        Extract text from image using Tesseract OCR.
        Returns: extracted text string
        """
        # Convert BGR to RGB for PIL/Tesseract
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)

        # Perform OCR
        try:
            text = pytesseract.image_to_string(pil_image, lang=lang)
            return text.strip()
        except Exception as e:
            raise RuntimeError(f"OCR failed: {e}")

    def extract_text_detailed(self, image, lang='eng'):
        """
        Extract text with detailed information (bounding boxes, confidence).
        Returns: dict with detailed OCR results
        """
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)

        # Get detailed data from Tesseract
        try:
            data = pytesseract.image_to_data(pil_image, lang=lang, output_type=pytesseract.Output.DICT)

            # Process results
            n_boxes = len(data['text'])
            results = {
                'text': '',
                'words': [],
                'lines': [],
                'confidence': 0.0,
                'word_count': 0
            }

            current_line = {'text': '', 'confidence': [], 'words': []}
            current_block_num = data['block_num'][0] if n_boxes > 0 else -1

            for i in range(n_boxes):
                conf = int(data['conf'][i])
                text = data['text'][i].strip()

                if conf > 0 and text:  # Valid text detected
                    x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]

                    word_data = {
                        'text': text,
                        'confidence': conf / 100.0,
                        'bbox': [x, y, w, h]
                    }

                    results['words'].append(word_data)
                    current_line['words'].append(word_data)
                    current_line['text'] += text + ' '
                    current_line['confidence'].append(conf)

                # Check if we've moved to a new line
                if i + 1 < n_boxes and data['block_num'][i + 1] != current_block_num:
                    if current_line['text'].strip():
                        avg_conf = sum(current_line['confidence']) / len(current_line['confidence']) if current_line['confidence'] else 0
                        results['lines'].append({
                            'text': current_line['text'].strip(),
                            'confidence': avg_conf / 100.0,
                            'words': current_line['words']
                        })
                    current_line = {'text': '', 'confidence': [], 'words': []}
                    current_block_num = data['block_num'][i + 1]

            # Add last line
            if current_line['text'].strip():
                avg_conf = sum(current_line['confidence']) / len(current_line['confidence']) if current_line['confidence'] else 0
                results['lines'].append({
                    'text': current_line['text'].strip(),
                    'confidence': avg_conf / 100.0,
                    'words': current_line['words']
                })

            # Calculate overall metrics
            results['text'] = '\n'.join([line['text'] for line in results['lines']])
            results['word_count'] = len(results['words'])

            if results['words']:
                results['confidence'] = sum(w['confidence'] for w in results['words']) / len(results['words'])

            return results

        except Exception as e:
            raise RuntimeError(f"Detailed OCR failed: {e}")


def command_detect(args):
    """Handle 'detect' command."""
    engine = OCREngine(debug=args.verbose)

    try:
        image = engine.load_image(args.image)
        has_text, confidence = engine.detect_text(image)

        print(f"Text detected: {'Yes' if has_text else 'No'}")
        print(f"Confidence: {confidence * 100:.1f}%")

        return 0 if has_text else 1

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def command_bounds(args):
    """Handle 'bounds' command."""
    engine = OCREngine(debug=args.verbose)

    try:
        image = engine.load_image(args.image)
        bounds = engine.find_character_bounds(image)

        print(f"Detected {len(bounds)} character/text regions")

        if args.output:
            engine.draw_bounds(image, bounds, args.output)
            print(f"Bounding boxes saved to {args.output}")

        if args.list:
            print("\nBounding boxes (x, y, width, height):")
            for i, (x, y, w, h) in enumerate(bounds, 1):
                print(f"  {i}. ({x}, {y}, {w}, {h})")

        return 0

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def command_extract(args):
    """Handle 'extract' command."""
    engine = OCREngine(debug=args.verbose)

    try:
        image = engine.load_image(args.image)
        text = engine.extract_text(image, lang=args.lang)

        if text:
            print("Extracted text:")
            print("-" * 40)
            print(text)
            print("-" * 40)

            if args.output:
                Path(args.output).write_text(text)
                print(f"\nText saved to {args.output}")
        else:
            print("No text detected in image")
            return 1

        return 0

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def command_process(args):
    """Handle 'process' command - full OCR pipeline."""
    engine = OCREngine(debug=args.verbose)

    try:
        image = engine.load_image(args.image)

        if args.format == 'json':
            # Detailed JSON output
            results = engine.extract_text_detailed(image, lang=args.lang)

            output = {
                'image': args.image,
                'text': results['text'],
                'confidence': round(results['confidence'], 3),
                'language': args.lang,
                'lines': len(results['lines']),
                'words': results['word_count']
            }

            if args.detailed:
                output['line_details'] = results['lines']
                output['word_details'] = results['words']

            print(json.dumps(output, indent=2))

            if args.output:
                Path(args.output).write_text(json.dumps(output, indent=2))

        else:
            # Human-readable text output
            results = engine.extract_text_detailed(image, lang=args.lang)

            print(f"Text: {results['text'][:100]}{'...' if len(results['text']) > 100 else ''}")
            print(f"Confidence: {results['confidence'] * 100:.1f}%")
            print(f"Language: {args.lang}")
            print(f"Lines: {len(results['lines'])}")
            print(f"Words: {results['word_count']}")

            if args.detailed:
                print("\nDetailed results:")
                print("-" * 60)
                print(results['text'])
                print("-" * 60)

            if args.output:
                Path(args.output).write_text(results['text'])
                print(f"\nText saved to {args.output}")

        return 0

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='OCR Tool - Optical Character Recognition for images',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Detect if image contains text
  ocr.py detect image.png

  # Find character boundaries
  ocr.py bounds image.png --output annotated.png

  # Extract text from image
  ocr.py extract image.png

  # Full OCR processing with JSON output
  ocr.py process image.png --format json --detailed

  # Extract text in different language
  ocr.py extract image.png --lang fra
        """
    )

    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Enable verbose output')

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Detect command
    detect_parser = subparsers.add_parser('detect', help='Detect if image contains text')
    detect_parser.add_argument('image', help='Path to image file')

    # Bounds command
    bounds_parser = subparsers.add_parser('bounds', help='Find character boundaries')
    bounds_parser.add_argument('image', help='Path to image file')
    bounds_parser.add_argument('-o', '--output', help='Save annotated image to file')
    bounds_parser.add_argument('-l', '--list', action='store_true',
                              help='List all bounding box coordinates')

    # Extract command
    extract_parser = subparsers.add_parser('extract', help='Extract text from image')
    extract_parser.add_argument('image', help='Path to image file')
    extract_parser.add_argument('-o', '--output', help='Save extracted text to file')
    extract_parser.add_argument('--lang', default='eng',
                               help='Language for OCR (default: eng)')

    # Process command
    process_parser = subparsers.add_parser('process', help='Full OCR processing')
    process_parser.add_argument('image', help='Path to image file')
    process_parser.add_argument('-f', '--format', choices=['text', 'json'], default='text',
                               help='Output format (default: text)')
    process_parser.add_argument('-o', '--output', help='Save results to file')
    process_parser.add_argument('-d', '--detailed', action='store_true',
                               help='Include detailed word/line information')
    process_parser.add_argument('--lang', default='eng',
                               help='Language for OCR (default: eng)')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Route to appropriate command handler
    commands = {
        'detect': command_detect,
        'bounds': command_bounds,
        'extract': command_extract,
        'process': command_process
    }

    return commands[args.command](args)


if __name__ == '__main__':
    sys.exit(main())
