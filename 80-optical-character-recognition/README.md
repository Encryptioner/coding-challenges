# Optical Character Recognition (OCR) Tool

A command-line tool for detecting and extracting text from images using computer vision and OCR technology.

## Features

- ✅ **Text Detection** - Detect whether images contain text
- ✅ **Character Bounds** - Find bounding boxes around characters and text regions
- ✅ **Text Extraction** - Extract text from images using Tesseract OCR
- ✅ **Full OCR Pipeline** - Complete processing with detailed results
- ✅ **Multiple Output Formats** - Text and JSON output
- ✅ **Multi-language Support** - Support for 100+ languages via Tesseract
- ✅ **Detailed Analysis** - Word-level and line-level confidence scores
- ✅ **Bounding Box Visualization** - Annotate images with detected regions
- ✅ **Batch Processing Ready** - Process multiple images programmatically

## Installation

### Prerequisites

This tool requires **Tesseract OCR** to be installed on your system:

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**Windows:**
Download and install from: https://github.com/UB-Mannheim/tesseract/wiki

### Python Dependencies

Install required Python packages:

```bash
pip install -r requirements.txt
```

Or manually:
```bash
pip install opencv-python pytesseract Pillow numpy
```

### Verify Installation

```bash
# Check Tesseract is installed
tesseract --version

# Make the script executable (Linux/macOS)
chmod +x ocr.py

# Test the tool
python3 ocr.py --help
```

## Usage

The tool provides four main commands: `detect`, `bounds`, `extract`, and `process`.

### 1. Text Detection

Detect whether an image contains text:

```bash
python3 ocr.py detect image.png
```

**Output:**
```
Text detected: Yes
Confidence: 85.0%
```

**Use Case:** Quickly filter images to find those containing text.

### 2. Character Boundaries

Find and visualize bounding boxes around text regions:

```bash
# Find boundaries and show count
python3 ocr.py bounds image.png

# Save annotated image with boxes drawn
python3 ocr.py bounds image.png --output annotated.png

# List all bounding box coordinates
python3 ocr.py bounds image.png --list
```

**Output:**
```
Detected 45 character/text regions
Bounding boxes saved to annotated.png

Bounding boxes (x, y, width, height):
  1. (23, 45, 12, 18)
  2. (38, 45, 15, 18)
  ...
```

**Use Case:** Debug text detection, analyze character positions, verify detection quality.

### 3. Text Extraction

Extract text from an image:

```bash
# Extract and print to console
python3 ocr.py extract image.png

# Save to file
python3 ocr.py extract image.png --output extracted.txt

# Extract text in different language (French)
python3 ocr.py extract image.png --lang fra
```

**Output:**
```
Extracted text:
----------------------------------------
Hello World
This is a test image
with multiple lines of text
----------------------------------------
```

**Supported Languages:**
- `eng` - English (default)
- `fra` - French
- `deu` - German
- `spa` - Spanish
- `chi_sim` - Chinese Simplified
- And 100+ more...

To see available languages: `tesseract --list-langs`

### 4. Full OCR Processing

Complete OCR pipeline with detailed results:

```bash
# Human-readable output
python3 ocr.py process image.png

# Detailed text output
python3 ocr.py process image.png --detailed

# JSON output
python3 ocr.py process image.png --format json

# Detailed JSON with word/line breakdown
python3 ocr.py process image.png --format json --detailed

# Save results to file
python3 ocr.py process image.png --format json -o results.json
```

**Human-Readable Output:**
```
Text: Hello World This is a test image...
Confidence: 89.5%
Language: eng
Lines: 3
Words: 12
```

**JSON Output (--detailed):**
```json
{
  "image": "image.png",
  "text": "Hello World\nThis is a test image\nwith multiple lines of text",
  "confidence": 0.895,
  "language": "eng",
  "lines": 3,
  "words": 12,
  "line_details": [
    {
      "text": "Hello World",
      "confidence": 0.95,
      "words": [
        {
          "text": "Hello",
          "confidence": 0.96,
          "bbox": [23, 45, 52, 18]
        },
        {
          "text": "World",
          "confidence": 0.94,
          "bbox": [78, 45, 58, 18]
        }
      ]
    }
  ],
  "word_details": [...]
}
```

**Use Cases:**
- Extract text for further processing
- Analyze OCR quality with confidence scores
- Integrate with other tools using JSON output
- Archive text content from images

## Command Reference

### Global Options

```
-v, --verbose    Enable verbose output for debugging
-h, --help       Show help message
```

### detect - Text Detection

```
usage: ocr.py detect [-h] image

positional arguments:
  image       Path to image file

options:
  -h, --help  show this help message and exit
```

**Returns:** Exit code 0 if text detected, 1 otherwise.

### bounds - Character Boundaries

```
usage: ocr.py bounds [-h] [-o OUTPUT] [-l] image

positional arguments:
  image                 Path to image file

options:
  -h, --help            show this help message and exit
  -o OUTPUT, --output OUTPUT
                        Save annotated image to file
  -l, --list            List all bounding box coordinates
```

### extract - Text Extraction

```
usage: ocr.py extract [-h] [-o OUTPUT] [--lang LANG] image

positional arguments:
  image                 Path to image file

options:
  -h, --help            show this help message and exit
  -o OUTPUT, --output OUTPUT
                        Save extracted text to file
  --lang LANG          Language for OCR (default: eng)
```

### process - Full OCR Pipeline

```
usage: ocr.py process [-h] [-f {text,json}] [-o OUTPUT] [-d] [--lang LANG] image

positional arguments:
  image                 Path to image file

options:
  -h, --help            show this help message and exit
  -f {text,json}, --format {text,json}
                        Output format (default: text)
  -o OUTPUT, --output OUTPUT
                        Save results to file
  -d, --detailed        Include detailed word/line information
  --lang LANG          Language for OCR (default: eng)
```

## How It Works

### Architecture

The OCR tool consists of several components:

1. **Image Loading**: Uses OpenCV to load and process images
2. **Text Detection**: Uses edge detection and morphological operations to find text regions
3. **Character Boundary Detection**: Uses adaptive thresholding and contour detection
4. **Text Recognition**: Uses Tesseract OCR engine for character recognition
5. **Post-Processing**: Formats results and calculates confidence scores

### Detection Pipeline

```
Input Image
    ↓
Grayscale Conversion
    ↓
Edge Detection (Canny)
    ↓
Morphological Operations (Dilation)
    ↓
Contour Detection
    ↓
Filter by Size & Aspect Ratio
    ↓
Text Regions Identified
```

### Recognition Pipeline

```
Input Image
    ↓
RGB Conversion
    ↓
Tesseract OCR Engine
    ↓
Character Recognition
    ↓
Confidence Scoring
    ↓
Text Output with Metadata
```

## Implementation Details

### Text Detection Algorithm

1. **Grayscale Conversion**: Simplifies image to single channel
2. **Edge Detection**: Canny algorithm detects character edges
3. **Dilation**: Connects nearby text components
4. **Contour Analysis**: Identifies potential text regions
5. **Filtering**: Removes noise based on size and aspect ratio

### Character Boundary Detection

1. **Adaptive Thresholding**: Handles varying lighting conditions
2. **Morphological Operations**: Connects broken characters
3. **Contour Detection**: Finds individual character boundaries
4. **Size Filtering**: Removes noise and non-text regions
5. **Sorting**: Orders regions top-to-bottom, left-to-right

### OCR Recognition

Uses **Tesseract OCR**, an open-source engine developed by Google:
- LSTM neural network-based recognition
- Support for 100+ languages
- Confidence scoring per word
- Handles various fonts and sizes
- Can be fine-tuned with custom training data

## Examples

### Example 1: Document Scanning

Extract text from a scanned document:

```bash
python3 ocr.py process document.png --format json -o document.json
```

Use the JSON output to index documents or build a search system.

### Example 2: Screenshot Text Extraction

Extract text from a screenshot:

```bash
python3 ocr.py extract screenshot.png --output screenshot.txt
```

### Example 3: Quality Analysis

Check OCR quality before processing:

```bash
python3 ocr.py bounds image.png --output check.png
```

Review `check.png` to see if text regions are detected correctly.

### Example 4: Multi-Language Document

Extract text from a French document:

```bash
python3 ocr.py extract french_doc.png --lang fra
```

### Example 5: Batch Processing

Process multiple images using a shell script:

```bash
#!/bin/bash
for img in images/*.png; do
    python3 ocr.py process "$img" --format json -o "${img%.png}.json"
done
```

## Testing

### Manual Testing

Test with sample images containing:

- **Printed Text**: Books, documents, signs
- **Screenshots**: Terminal output, code, UI text
- **Natural Scenes**: Street signs, storefronts
- **Mixed Content**: Text with images, logos
- **Challenging Cases**: Low resolution, rotated, blurry

### Expected Results

**Good Quality (Confidence > 90%)**:
- Clean printed text
- High resolution scans
- Good contrast
- Horizontal text

**Medium Quality (Confidence 70-90%)**:
- Screenshots with anti-aliasing
- Slightly blurry images
- Moderate background noise
- Mixed fonts and sizes

**Poor Quality (Confidence < 70%)**:
- Very low resolution
- Severe blur or distortion
- Complex backgrounds
- Heavily stylized fonts
- Handwritten text

### Creating Test Images

You can create test images programmatically:

```python
from PIL import Image, ImageDraw, ImageFont

# Create image with text
img = Image.new('RGB', (400, 100), color='white')
d = ImageDraw.Draw(img)
d.text((10, 10), "Hello World", fill='black')
img.save('test.png')
```

## Performance Considerations

### Speed

- **Detection**: Fast (~10-50ms for 1MP image)
- **Boundary Finding**: Fast (~20-100ms)
- **OCR Recognition**: Slower (~100-1000ms depending on image complexity)

### Optimization Tips

1. **Resize Large Images**: Scale down to 2-4MP for faster processing
2. **Preprocess**: Convert to grayscale, increase contrast
3. **Batch Processing**: Process multiple images in parallel
4. **Use detect First**: Skip OCR if no text detected
5. **Limit Search Areas**: Crop to text regions before OCR

### Memory Usage

- Typical: 50-200MB for single image
- Large images: Up to 500MB-1GB
- Batch processing: Memory usage is sequential (one image at a time)

## Limitations

### Current Limitations

1. **Handwriting**: Poor accuracy with handwritten text (use specialized models)
2. **Rotation**: Works best with upright text (< 15° rotation)
3. **Distortion**: Struggles with perspective distortion or curved text
4. **Artistic Fonts**: Limited support for highly stylized fonts
5. **Background**: Complex backgrounds reduce accuracy
6. **Resolution**: Requires minimum ~300 DPI for best results

### Known Issues

- May detect non-text patterns as text (false positives)
- Confidence scores are estimates, not guarantees
- Very small text (< 10pt) may not be detected
- Mixed languages in same image may reduce accuracy

## Troubleshooting

### "Tesseract not found" Error

**Problem**: pytesseract can't find Tesseract installation

**Solution**:
```python
# Linux/macOS - Tesseract usually in PATH
# Windows - Set path manually in ocr.py:
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Poor OCR Accuracy

**Problem**: Text extraction has many errors

**Solutions**:
1. Preprocess image: increase contrast, sharpen
2. Ensure minimum 300 DPI resolution
3. Try different Tesseract PSM modes (Page Segmentation Modes)
4. Check if correct language is specified
5. Fine-tune Tesseract with custom training data

### No Text Detected

**Problem**: Tool reports no text when text is clearly visible

**Solutions**:
1. Adjust detection thresholds in code
2. Try different preprocessing (blur, threshold)
3. Check image format and color space
4. Increase image resolution
5. Use `--verbose` flag to see what's happening

### Slow Performance

**Problem**: Processing takes too long

**Solutions**:
1. Resize large images before processing
2. Use `detect` command first to skip empty images
3. Crop to regions of interest
4. Disable detailed mode if not needed
5. Consider GPU-accelerated OCR alternatives

## Future Enhancements

Possible improvements:

1. **GPU Acceleration**: Use CUDA for faster processing
2. **Deep Learning OCR**: Integrate EasyOCR or PaddleOCR
3. **Rotation Correction**: Auto-detect and correct text rotation
4. **Layout Analysis**: Preserve document structure, tables, columns
5. **Handwriting Support**: Add handwriting recognition models
6. **PDF Support**: Extract text from PDF documents
7. **Video OCR**: Process video frames for real-time text extraction
8. **Spell Checking**: Post-process with spell correction
9. **Web Interface**: Add REST API and web UI
10. **Confidence Thresholds**: Filter low-confidence results

## Technical Stack

- **Python 3**: Core language
- **OpenCV**: Image processing and computer vision
- **Tesseract**: OCR engine
- **pytesseract**: Python wrapper for Tesseract
- **Pillow (PIL)**: Image manipulation
- **NumPy**: Numerical operations

## Resources

### Documentation
- [Tesseract Documentation](https://tesseract-ocr.github.io/)
- [OpenCV Documentation](https://docs.opencv.org/)
- [pytesseract Documentation](https://pypi.org/project/pytesseract/)

### Related Projects
- [EasyOCR](https://github.com/JaidedAI/EasyOCR) - Deep learning-based OCR
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) - Multi-language OCR
- [CRAFT](https://github.com/clovaai/CRAFT-pytorch) - Character region detection
- [TrOCR](https://huggingface.co/microsoft/trocr-base-printed) - Transformer-based OCR

### Learning Resources
- [Image Processing Fundamentals](https://opencv-python-tutroals.readthedocs.io/)
- [OCR Algorithms](https://en.wikipedia.org/wiki/Optical_character_recognition)
- [Tesseract Training](https://tesseract-ocr.github.io/tessdoc/Training-Tesseract.html)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Areas for improvement:
- Better preprocessing algorithms
- Additional output formats
- Performance optimizations
- Bug fixes and testing
- Documentation improvements

## Author

Created as part of the [Coding Challenges](https://codingchallenges.fyi/challenges/challenge-ocr) series.

## Acknowledgments

- Google Tesseract OCR team
- OpenCV contributors
- pytesseract maintainers
- CodingChallenges.fyi for the challenge inspiration
