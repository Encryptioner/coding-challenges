# OCR Algorithms and Computer Vision Deep Dive

This document provides a comprehensive deep dive into the algorithms and computer vision techniques used in the OCR tool.

## Table of Contents

1. [Introduction to OCR](#introduction-to-ocr)
2. [Image Processing Fundamentals](#image-processing-fundamentals)
3. [Edge Detection (Canny Algorithm)](#edge-detection-canny-algorithm)
4. [Morphological Operations](#morphological-operations)
5. [Contour Detection and Analysis](#contour-detection-and-analysis)
6. [Adaptive Thresholding](#adaptive-thresholding)
7. [Tesseract OCR Engine](#tesseract-ocr-engine)
8. [Character Recognition](#character-recognition)
9. [Confidence Scoring](#confidence-scoring)
10. [Alternative Approaches](#alternative-approaches)

## Introduction to OCR

Optical Character Recognition (OCR) is the process of converting images containing text into machine-encoded text. Modern OCR systems typically consist of several stages:

```
Input Image
    ↓
Preprocessing (Grayscale, Denoise, Normalize)
    ↓
Text Detection (Find text regions)
    ↓
Text Localization (Character boundaries)
    ↓
Character Recognition (Identify characters)
    ↓
Post-processing (Spell check, formatting)
    ↓
Output Text
```

### Historical Context

**Early OCR (1950s-1970s)**
- Template matching
- Single font support
- Highly constrained environments

**Classical OCR (1980s-2000s)**
- Feature-based recognition
- Multiple fonts
- Statistical methods
- Hidden Markov Models

**Modern OCR (2010s-present)**
- Deep learning (CNNs, RNNs)
- End-to-end learning
- Multi-language support
- Real-time processing

## Image Processing Fundamentals

### Color Spaces

**RGB (Red, Green, Blue)**
- Standard computer representation
- 3 channels, each 0-255
- 16.7 million possible colors

```python
# RGB image shape: (height, width, 3)
rgb_image[y, x] = [R, G, B]
```

**BGR (Blue, Green, Red)**
- OpenCV's default format
- Same as RGB but reversed channel order
- Historical convention from early color cameras

```python
# BGR in OpenCV
bgr_image = cv2.imread('image.png')  # Loads as BGR
```

**Grayscale**
- Single channel, 0-255
- Represents intensity/brightness
- Reduces complexity for processing

**Conversion Formula:**
```
Gray = 0.299*R + 0.587*G + 0.114*B
```

The weights reflect human perception (more sensitive to green).

```python
# OpenCV conversion
gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
```

**Why Grayscale for OCR?**
1. Text is primarily intensity-based (light vs dark)
2. Color doesn't add information for most text
3. 3x faster processing (1 channel vs 3)
4. Simpler algorithms

### Image Representation

**Numpy Array Structure:**

```python
import numpy as np

# Grayscale image
gray_image = np.array([
    [0, 50, 100],
    [150, 200, 255],
    [128, 64, 32]
], dtype=np.uint8)

# Shape: (height, width)
print(gray_image.shape)  # (3, 3)

# Access pixel
print(gray_image[1, 2])  # Row 1, Column 2 = 255

# Color image
color_image = np.zeros((3, 3, 3), dtype=np.uint8)
# Shape: (height, width, channels)
```

**Data Type:**
- `uint8`: Unsigned 8-bit integer (0-255)
- Most common for images
- Efficient memory usage

## Edge Detection (Canny Algorithm)

Edge detection identifies rapid intensity changes in images, which typically correspond to object boundaries.

### Canny Edge Detection

Developed by John Canny in 1986, this multi-stage algorithm is optimal for edge detection.

**Stage 1: Gaussian Blur (Noise Reduction)**

Apply Gaussian filter to smooth the image and reduce noise.

**Gaussian Kernel (5×5 example):**
```
1/256 * [
    [1,  4,  6,  4,  1],
    [4, 16, 24, 16,  4],
    [6, 24, 36, 24,  6],
    [4, 16, 24, 16,  4],
    [1,  4,  6,  4,  1]
]
```

**Mathematical Formula:**
```
G(x, y) = (1/(2πσ²)) * exp(-(x² + y²)/(2σ²))
```

Where σ (sigma) is the standard deviation.

**Purpose:**
- Reduces high-frequency noise
- Prevents false edge detection
- Smooths image while preserving edges

**Stage 2: Gradient Calculation**

Compute image gradients using Sobel operators.

**Sobel X (horizontal edges):**
```
[-1  0  +1]
[-2  0  +2]
[-1  0  +1]
```

**Sobel Y (vertical edges):**
```
[-1  -2  -1]
[ 0   0   0]
[+1  +2  +1]
```

**Gradient Magnitude:**
```
G = √(Gx² + Gy²)
```

**Gradient Direction:**
```
θ = arctan(Gy / Gx)
```

**Stage 3: Non-Maximum Suppression**

Thin edges by keeping only local maxima in gradient direction.

**Algorithm:**
```python
for each pixel (x, y):
    # Get gradient direction
    angle = gradient_direction[y, x]

    # Round to nearest 45° (0, 45, 90, 135)
    direction = round(angle / 45) * 45

    # Check if pixel is maximum along gradient direction
    if direction == 0:  # Horizontal
        if G[y, x] >= G[y, x-1] and G[y, x] >= G[y, x+1]:
            keep pixel
    elif direction == 90:  # Vertical
        if G[y, x] >= G[y-1, x] and G[y, x] >= G[y+1, x]:
            keep pixel
    # ... similar for 45° and 135°
```

**Result:** Thin, single-pixel-wide edges.

**Stage 4: Hysteresis Thresholding**

Use two thresholds to classify edges.

**Categories:**
- Strong edge: `G > high_threshold`
- Weak edge: `low_threshold < G < high_threshold`
- Non-edge: `G < low_threshold`

**Algorithm:**
```python
# Keep all strong edges
edges = (G > high_threshold)

# Keep weak edges connected to strong edges
for each weak_edge_pixel:
    if connected_to_strong_edge:
        keep pixel
    else:
        discard pixel
```

**Rationale:**
- Strong edges are definitely real
- Weak edges might be noise OR part of real edge
- Keep weak edges only if they connect to strong edges

**In Our Implementation:**

```python
edges = cv2.Canny(gray, 50, 150)
#                      ^^  ^^^
#                      low high threshold
```

**Choosing Thresholds:**
- `low_threshold = 50`: Catches potential edges
- `high_threshold = 150`: Confirms strong edges
- Ratio typically 1:2 or 1:3

**Output:** Binary image (0 or 255) with edges marked white.

### Why Canny for Text Detection?

1. **Optimal edge detection**: Mathematically proven to minimize error
2. **Good localization**: Edges close to true boundaries
3. **Single response**: One edge per boundary (no duplicate edges)
4. **Robust to noise**: Gaussian smoothing reduces false positives

**Text Characteristics:**
- High contrast between text and background
- Clear boundaries (character edges)
- Relatively noise-free in printed text

## Morphological Operations

Mathematical morphology uses set theory to analyze geometric structures in images.

### Basic Operations

**Structuring Element (Kernel)**

A small shape/matrix used to probe the image.

**Common Kernels:**

```python
# Rectangular (5×5)
rect_kernel = np.ones((5, 5), np.uint8)

# Cross
cross_kernel = np.array([
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
], np.uint8)

# Elliptical
ellipse_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
```

### Dilation

Expands white regions (foreground) by adding pixels.

**Mathematical Definition:**
```
(A ⊕ B)[x, y] = max{A[x-i, y-j] + B[i, j]}
```

Where A is the image, B is the structuring element.

**Simplified:** If any pixel under the kernel is white, output is white.

**Visual Example:**

```
Original:          Kernel (3×3):      After Dilation:
  . . .               1 1 1             █ █ █
  . █ .               1 1 1             █ █ █
  . . .               1 1 1             █ █ █
```

**Algorithm:**

```python
def dilate(image, kernel):
    output = np.zeros_like(image)
    k_h, k_w = kernel.shape
    pad = k_h // 2

    for y in range(pad, height - pad):
        for x in range(pad, width - pad):
            # Extract region
            region = image[y-pad:y+pad+1, x-pad:x+pad+1]

            # Apply kernel
            result = np.logical_and(region, kernel)

            # Take maximum
            output[y, x] = 255 if np.any(result) else 0

    return output
```

**Uses in OCR:**
1. **Connect broken characters**: Fill gaps in letters
2. **Merge nearby text**: Connect characters into words
3. **Strengthen weak edges**: Make faint text more visible

**OpenCV:**

```python
dilated = cv2.dilate(image, kernel, iterations=1)
```

### Erosion

Shrinks white regions (foreground) by removing pixels.

**Mathematical Definition:**
```
(A ⊖ B)[x, y] = min{A[x+i, y+j] - B[i, j]}
```

**Simplified:** Only white if all pixels under kernel are white.

**Visual Example:**

```
Original:          Kernel (3×3):      After Erosion:
  █ █ █              1 1 1             . . .
  █ █ █              1 1 1             . █ .
  █ █ █              1 1 1             . . .
```

**Uses in OCR:**
1. **Remove noise**: Eliminate small white specks
2. **Separate touching characters**: Break connections
3. **Thin thick text**: Reduce character width

### Opening

Erosion followed by dilation (removes noise while preserving shape).

```python
opening = cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
# Equivalent to:
# temp = cv2.erode(image, kernel)
# opening = cv2.dilate(temp, kernel)
```

**Effect:**
- Removes small white noise
- Preserves large structures
- Smooths object boundaries

### Closing

Dilation followed by erosion (fills gaps while preserving shape).

```python
closing = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
# Equivalent to:
# temp = cv2.dilate(image, kernel)
# closing = cv2.erode(temp, kernel)
```

**Effect:**
- Fills small holes
- Connects nearby objects
- Smooths boundaries

**In Our Implementation:**

```python
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
dilated = cv2.dilate(edges, kernel, iterations=1)
```

**Why 5×5 rectangular kernel?**
- Large enough to connect nearby edges (letters → words)
- Small enough to keep words separate
- Rectangular works well for horizontal text
- 1 iteration is conservative (prevents over-merging)

## Contour Detection and Analysis

Contours are curves joining continuous points along a boundary.

### Finding Contours

**Algorithm: Border Following**

1. Scan image top-to-bottom, left-to-right
2. When white pixel found, start tracing boundary
3. Follow boundary clockwise
4. Store boundary points
5. Mark contour as visited
6. Continue scanning

**OpenCV Implementation:**

```python
contours, hierarchy = cv2.findContours(
    binary_image,
    cv2.RETR_EXTERNAL,  # Retrieval mode
    cv2.CHAIN_APPROX_SIMPLE  # Approximation method
)
```

### Retrieval Modes

**RETR_EXTERNAL**
- Only outermost contours
- Ignores holes and nested contours
- Fastest option

**RETR_LIST**
- All contours
- No hierarchy information
- Treats all equally

**RETR_TREE**
- All contours with full hierarchy
- Parent-child relationships
- Useful for nested shapes

**RETR_CCOMP**
- Two-level hierarchy
- External and holes

**For OCR:** `RETR_EXTERNAL` is ideal (we want text regions, not details within letters).

### Approximation Methods

**CHAIN_APPROX_NONE**
- Store all boundary points
- Complete information
- Large memory usage

**CHAIN_APPROX_SIMPLE**
- Compress horizontal, vertical, diagonal segments
- Store only endpoints
- Much smaller memory

**Example:**

```
Rectangle boundary:
NONE:   [(0,0), (1,0), (2,0), (3,0), (3,1), (3,2), ...]
SIMPLE: [(0,0), (3,0), (3,3), (0,3)]
```

### Contour Properties

**Bounding Rectangle:**

```python
x, y, w, h = cv2.boundingRect(contour)
```

Returns axis-aligned rectangle (smallest rectangle containing contour).

```
Contour:         Bounding Rectangle:
   ██                ┌──────┐
  ████               │  ██  │
   ██                │ ████ │
                     │  ██  │
                     └──────┘
                   (x,y)    w
                        h
```

**Area:**

```python
area = cv2.contourArea(contour)
```

Calculates area using Green's theorem:

```
A = ½ |Σ(x[i]*y[i+1] - x[i+1]*y[i])|
```

**Perimeter:**

```python
perimeter = cv2.arcLength(contour, closed=True)
```

Sum of Euclidean distances between consecutive points.

**Aspect Ratio:**

```python
aspect_ratio = float(w) / h
```

Useful for filtering shapes:
- Aspect ratio ≈ 1: Square-like (O, D, Q)
- Aspect ratio > 3: Horizontal line or wide text
- Aspect ratio < 0.3: Vertical line or tall text

### Filtering in Our OCR Tool

**Text Detection Filtering:**

```python
for contour in contours:
    x, y, w, h = cv2.boundingRect(contour)
    aspect_ratio = w / float(h) if h > 0 else 0
    area = cv2.contourArea(contour)

    if 0.2 < aspect_ratio < 10 and area > 50:
        text_contours.append(contour)
```

**Rationale:**

1. **Aspect Ratio (0.2 to 10):**
   - Excludes very thin lines (|: ratio ≈ 0.05)
   - Excludes very wide lines (—: ratio ≈ 20)
   - Includes most text (ratio typically 0.3-3.0)
   - Generous range for rotated or stylized text

2. **Minimum Area (> 50 pixels):**
   - Filters out noise (dust, artifacts)
   - Removes single-pixel false positives
   - Adjustable based on image resolution
   - For 1920×1080: 50px is ~0.002% of image

**Character Bounds Filtering:**

```python
if area > 20 and w > 2 and h > 2:
    aspect_ratio = w / float(h)
    if 0.1 < aspect_ratio < 10:
        bounds.append((x, y, w, h))
```

**More Aggressive Filtering:**
- Smaller area threshold (20 vs 50)
- Minimum dimensions (w > 2, h > 2)
- Wider aspect ratio range (0.1-10)
- Goal: Catch individual characters, not just words

## Adaptive Thresholding

Converts grayscale to binary (black/white) using local thresholds.

### Global vs Adaptive

**Global Thresholding:**

```python
_, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
```

Uses single threshold for entire image.

**Problems:**
- Uneven lighting creates shadows
- Background variations
- Can't handle gradients

**Example:**

```
Input (gradient background):     Global Threshold (T=127):
100 110 120 130 140 150 160      0   0   0   255 255 255 255
 98 108 118 128 138 148 158      0   0   0   255 255 255 255
 96 106 116 126 136 146 156      0   0   0   0   255 255 255
```

Notice: Left side incorrectly black, inconsistent results.

**Adaptive Thresholding:**

```python
binary = cv2.adaptiveThreshold(
    gray,
    255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY_INV,
    blockSize=11,
    C=2
)
```

Calculates threshold locally for each pixel based on neighborhood.

### Algorithm

**For each pixel (x, y):**

1. **Define neighborhood**: Block around pixel (blockSize × blockSize)
2. **Calculate local statistics**: Mean or weighted mean
3. **Compute threshold**: T = mean - C
4. **Apply threshold**: pixel = 255 if pixel > T else 0

### Adaptive Methods

**ADAPTIVE_THRESH_MEAN_C**

Threshold = arithmetic mean of neighborhood - C

```
T(x, y) = (1/n) * Σ(neighborhood pixels) - C
```

**ADAPTIVE_THRESH_GAUSSIAN_C**

Threshold = weighted mean (Gaussian weights) - C

```
T(x, y) = Σ(Gaussian(i,j) * pixel(x+i, y+j)) - C
```

**Gaussian Weights (5×5 example):**
```
1/256 * [
    [1,  4,  6,  4,  1],
    [4, 16, 24, 16,  4],
    [6, 24, 36, 24,  6],
    [4, 16, 24, 16,  4],
    [1,  4,  6,  4,  1]
]
```

Center pixels weighted more heavily.

**Why Gaussian for OCR?**
- Smoother thresholds
- Less affected by noise
- Better for text (local contrast matters more)

### Parameters

**blockSize (11 in our implementation)**

Size of neighborhood for threshold calculation.

- Must be odd (3, 5, 7, 9, 11, ...)
- Larger values: More global, smoother
- Smaller values: More local, sensitive to variations

**Choosing blockSize:**
```
blockSize ≈ 2 * (character_height) + 1
```

For typical text (20-30px high): 11 is reasonable.

**C (2 in our implementation)**

Constant subtracted from mean.

- Fine-tunes threshold
- Positive C: Makes output darker (more black)
- Negative C: Makes output lighter (more white)
- Typical range: 0-10

**Effect of C:**

```
C = 0:  More permissive (more white pixels)
C = 5:  Balanced
C = 10: More strict (more black pixels)
```

For text on light background: C = 2-5 works well.

### Binary Inversion

**THRESH_BINARY:**
- pixel > T → white (255)
- pixel <= T → black (0)

**THRESH_BINARY_INV:** (used in our OCR)
- pixel > T → black (0)
- pixel <= T → white (255)

**Why invert for OCR?**
- Text is usually dark on light background
- After inversion: text becomes white (255)
- White = foreground in OpenCV morphology operations
- Easier to process white text on black background

### Visual Example

```
Original Grayscale:
[120, 125, 130, 200, 205, 210]

Local means (blockSize=3):
[125, 127, 178, 205, 208, 208]

Thresholds (C=2):
[123, 125, 176, 203, 206, 206]

THRESH_BINARY_INV result:
[255, 255, 255, 255,   0,   0]
       ↑     ↑     ↑     ↑     ↑     ↑
     120   125   130   200   205   210
  <= 123 <=125 <=176  >203  >206  >206
```

## Tesseract OCR Engine

Tesseract is an open-source OCR engine developed originally by HP (1985-1994), then by Google (2006-present).

### Architecture

**Tesseract 4.0+ Architecture:**

```
Input Image
    ↓
Line Detection
    ↓
Word Detection
    ↓
Character Segmentation (Optional)
    ↓
LSTM Neural Network
    ↓
Language Model
    ↓
Text Output
```

### LSTM (Long Short-Term Memory)

Tesseract 4+ uses LSTM neural networks for character recognition.

**Why LSTM?**
- Handles sequential data (text is sequential)
- Captures context (previous characters influence recognition)
- Better accuracy than traditional methods
- Handles connected characters

**Architecture:**

```
Input: Normalized text line image
    ↓
Convolutional Layers (feature extraction)
    ↓
Bidirectional LSTM Layers
    ↓
Softmax Output (character probabilities)
    ↓
CTC Decoding (Connectionist Temporal Classification)
    ↓
Text Output
```

**Bidirectional:** Reads text left-to-right AND right-to-left for context.

### Recognition Process

**Step 1: Line Finding**

Tesseract detects text lines using projection profiles.

```
Horizontal Projection:
Sum pixels along each row

[text line 1]  →  High sum
[whitespace ]  →  Low sum
[text line 2]  →  High sum
```

Lines detected by finding peaks in projection.

**Step 2: Baseline Detection**

Find baseline (bottom of text) and x-height (top of lowercase letters).

```
Ascenders (b, d, h, k, l): Above x-height
X-height  (a, c, e, o, x): Main body
Baseline  (bottom of text)
Descenders (g, p, q, y):  Below baseline
```

**Step 3: Word Detection**

Group characters into words using spacing.

**Algorithm:**
```
spaces_between_characters → measure gaps
large_gaps → word boundaries
small_gaps → same word
```

**Step 4: Character Recognition**

LSTM network processes normalized text line.

**Input:** Sequence of image columns
**Output:** Sequence of character probabilities

**CTC Decoding:** Converts probability sequence to text.

```
Probabilities:  H H E E L L L L O O
CTC Decode:     H   E   L       O
Output:         "HELLO"
```

### Language Models

Tesseract uses language-specific data:

**Components:**
1. **Trained LSTM model**: Character recognition
2. **Dictionary**: Valid words
3. **Patterns**: Common character sequences
4. **Unicharset**: Character set (alphabet)

**Language File Structure:**

```
/usr/share/tesseract-ocr/4.00/tessdata/
├── eng.traineddata    # English
├── fra.traineddata    # French
├── deu.traineddata    # German
├── spa.traineddata    # Spanish
└── chi_sim.traineddata # Chinese Simplified
```

**Multi-language:**

```python
# Use English and French
text = pytesseract.image_to_string(image, lang='eng+fra')
```

Tesseract tries both models and uses best result.

### Page Segmentation Modes (PSM)

Controls how Tesseract interprets page layout.

```
PSM 0:  Orientation and script detection only
PSM 1:  Automatic page segmentation with OSD
PSM 3:  Fully automatic (DEFAULT)
PSM 4:  Single column of variable sizes
PSM 6:  Single uniform block of text
PSM 7:  Single text line
PSM 11: Sparse text, find as much text as possible
PSM 13: Raw line (bypass segmentation)
```

**Our implementation uses default (PSM 3):** Fully automatic.

**Custom PSM:**

```python
custom_config = r'--psm 6'  # Single block
text = pytesseract.image_to_string(image, config=custom_config)
```

### Output Levels

Tesseract provides multiple output levels:

**Levels:**
```
1: Page
2: Block (paragraph)
3: Paragraph
4: Line
5: Word
```

**image_to_data output:**

```python
data = pytesseract.image_to_data(image, output_type=Output.DICT)

# Returns:
{
    'level': [1, 2, 3, 4, 5, ...],
    'page_num': [1, 1, 1, ...],
    'block_num': [0, 1, 1, 2, ...],
    'par_num': [0, 0, 1, 1, ...],
    'line_num': [0, 0, 0, 1, ...],
    'word_num': [0, 0, 0, 0, 1, ...],
    'left': [x coordinates],
    'top': [y coordinates],
    'width': [widths],
    'height': [heights],
    'conf': [confidence scores],
    'text': [recognized text]
}
```

**Using hierarchy:**

```python
# Group by block (paragraph)
current_block = data['block_num'][0]
for i in range(len(data['text'])):
    if data['block_num'][i] != current_block:
        # New paragraph
        current_block = data['block_num'][i]
```

## Character Recognition

### Feature Extraction (Traditional)

Before deep learning, OCR used hand-crafted features.

**Common Features:**

**1. Zoning**
Divide character into zones, count black pixels in each.

```
Zone grid (3×3):
┌───┬───┬───┐
│ 5 │ 8 │ 2 │  → Feature vector: [5, 8, 2, 3, 12, 1, 0, 2, 4]
├───┼───┼───┤
│ 3 │12 │ 1 │
├───┼───┼───┤
│ 0 │ 2 │ 4 │
└───┴───┴───┘
```

**2. Projection Profiles**

```
Horizontal: Sum pixels per row
Vertical:   Sum pixels per column

Letter 'T':
Vertical profile:     Horizontal profile:
    ████                  Row 1: ████ (high)
      █                   Row 2: █ (low)
      █                   Row 3: █ (low)
      █                   Row 4: █ (low)
```

**3. Stroke Features**
- Number of endpoints
- Number of junctions
- Holes/loops count
- Stroke direction histogram

**4. Gradient Features**
- Histogram of Oriented Gradients (HOG)
- Edge direction distribution

### Deep Learning Recognition

**Convolutional Neural Networks (CNN):**

```
Input Image (28×28)
    ↓
Conv Layer 1 (32 filters, 3×3)
    ↓
ReLU Activation
    ↓
MaxPool (2×2)
    ↓
Conv Layer 2 (64 filters, 3×3)
    ↓
ReLU Activation
    ↓
MaxPool (2×2)
    ↓
Flatten
    ↓
Dense Layer (128 neurons)
    ↓
Dropout (0.5)
    ↓
Output Layer (Softmax, 26 classes for A-Z)
    ↓
Character Prediction
```

**Why CNN for characters?**
- Translation invariant (works regardless of position)
- Learns hierarchical features automatically
- No manual feature engineering
- Better accuracy than traditional methods

### Tesseract's LSTM Approach

**Input Processing:**

```python
# Normalize line height
target_height = 48  # pixels
scale_factor = target_height / actual_height
normalized_image = cv2.resize(image, None, fx=scale_factor, fy=scale_factor)

# Convert to sequence
# Each column of image becomes one timestep
sequence = [normalized_image[:, i] for i in range(width)]
```

**LSTM Processing:**

```
Time:    t=0   t=1   t=2   t=3   t=4   ...
Input:   Col0  Col1  Col2  Col3  Col4  ...
         ↓     ↓     ↓     ↓     ↓
LSTM:   [LSTM Cell]  →  [LSTM Cell]  →  ...
         ↓     ↓     ↓     ↓     ↓
Output:  P(H)  P(HE) P(HEL) P(HELL) P(HELLO)
```

**Each timestep outputs probability distribution over characters.**

**CTC Loss:**

Allows network to output variable-length sequences from fixed-length input.

```
Input sequence:  100 timesteps
Output sequence: "HELLO" (5 characters)
```

CTC handles alignment automatically.

## Confidence Scoring

### Tesseract Confidence

Tesseract provides confidence scores (0-100) for each word.

**Calculation:**

```
confidence = exp(log_probability * scale_factor)
```

Where `log_probability` comes from LSTM output.

**Factors affecting confidence:**

1. **Character clarity**: Sharp, clear characters → high confidence
2. **Context**: Dictionary words → higher confidence
3. **Consistency**: Consistent font/size → higher confidence
4. **Ambiguity**: Similar characters (O vs 0) → lower confidence

**Interpretation:**

```
90-100:  Excellent (very likely correct)
70-89:   Good (probably correct)
50-69:   Fair (may have errors)
0-49:    Poor (likely incorrect)
```

**Confidence = -1:** No text detected in region.

### Our Aggregate Confidence

**Word-level averaging:**

```python
if results['words']:
    total_conf = sum(w['confidence'] for w in results['words'])
    results['confidence'] = total_conf / len(results['words'])
```

**Weighted by word length:**

```python
total_weight = sum(len(w['text']) * w['confidence'] for w in results['words'])
total_chars = sum(len(w['text']) for w in results['words'])
weighted_conf = total_weight / total_chars if total_chars > 0 else 0
```

Longer words influence overall confidence more.

## Alternative Approaches

### Template Matching

**Method:** Compare input characters against stored templates.

**Algorithm:**

```python
def recognize_character(char_image, templates):
    best_match = None
    best_score = 0

    for char, template in templates.items():
        # Normalize sizes
        resized_char = cv2.resize(char_image, template.shape[::-1])

        # Calculate similarity
        similarity = cv2.matchTemplate(resized_char, template, cv2.TM_CCOEFF_NORMED)

        if similarity > best_score:
            best_score = similarity
            best_match = char

    return best_match, best_score
```

**Pros:**
- Simple to implement
- Fast for small character sets
- No training required

**Cons:**
- Doesn't handle font variations
- Sensitive to size, rotation, noise
- Requires exact template for each font

### Neural Network Classifier

**Method:** Train CNN to classify individual characters.

**Architecture:**

```python
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    MaxPooling2D((2, 2)),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(62, activation='softmax')  # A-Z, a-z, 0-9
])
```

**Training:**
- Dataset: EMNIST (800,000+ characters)
- Augmentation: Rotation, scaling, noise
- Training time: 2-4 hours on GPU

**Pros:**
- High accuracy (95-99%)
- Handles font variations
- Robust to noise

**Cons:**
- Requires training data
- Needs character segmentation
- Doesn't capture context

### EasyOCR

Deep learning-based OCR alternative to Tesseract.

**Features:**
- 80+ language support
- GPU acceleration
- No preprocessing needed
- Good for natural scenes

**Usage:**

```python
import easyocr

reader = easyocr.Reader(['en'])
result = reader.readtext('image.png')

# Returns: [(bbox, text, confidence), ...]
```

**Pros:**
- Higher accuracy (especially for difficult images)
- End-to-end deep learning
- Handles rotated text

**Cons:**
- Slower (requires GPU for speed)
- Larger memory footprint
- Less mature than Tesseract

### PaddleOCR

Another deep learning OCR framework.

**Architecture:**
- Text detection: DB (Differentiable Binarization)
- Text recognition: CRNN (CNN + RNN + CTC)

**Features:**
- Very fast
- High accuracy
- Good for Asian languages

**Pros:**
- State-of-the-art accuracy
- Well-optimized
- Active development

**Cons:**
- Heavier dependencies
- More complex setup

## Conclusion

This OCR implementation combines classical computer vision techniques (Canny edge detection, morphological operations, adaptive thresholding) with modern deep learning (Tesseract's LSTM). This hybrid approach provides:

1. **Robust text detection** using proven CV algorithms
2. **Accurate recognition** using neural networks
3. **Good performance** without requiring GPU
4. **Multi-language support** through Tesseract
5. **Practical usability** with simple installation

Understanding these algorithms enables:
- Better preprocessing decisions
- Effective parameter tuning
- Debugging detection issues
- Choosing appropriate alternatives
- Implementing custom improvements

The field of OCR continues to evolve, with deep learning pushing accuracy higher while maintaining real-time performance.
