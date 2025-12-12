# Watermark Detection and Removal Algorithms

This document provides an in-depth explanation of the computer vision algorithms used for watermark detection and removal.

## Table of Contents

1. [Overview](#overview)
2. [Watermark Detection Algorithm](#watermark-detection-algorithm)
3. [Watermark Removal Algorithm](#watermark-removal-algorithm)
4. [OpenCV.js Integration](#opencvjs-integration)
5. [Performance Optimizations](#performance-optimizations)
6. [Limitations and Edge Cases](#limitations-and-edge-cases)

---

## Overview

The watermark removal process consists of two main stages:

1. **Detection**: Locate watermark regions in the image
2. **Removal**: Fill detected regions using inpainting algorithms

Both stages leverage OpenCV.js, a JavaScript port of the OpenCV computer vision library compiled to WebAssembly for browser execution.

---

## Watermark Detection Algorithm

### High-Level Process

```
Input Image
    ↓
Grayscale Conversion
    ↓
Brightness Thresholding
    ↓
Morphological Operations
    ↓
Contour Detection
    ↓
Region Filtering
    ↓
Output: List of Regions
```

### Step-by-Step Explanation

#### 1. Grayscale Conversion

**Why**: Watermarks are often brighter than the surrounding image. Grayscale simplifies brightness analysis.

**Implementation**:
```typescript
const gray = new cv.Mat();
cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
```

**Effect**: Converts RGBA image to single-channel grayscale (0-255 per pixel).

#### 2. Brightness Thresholding

**Why**: Separate bright watermark pixels from darker background.

**Implementation**:
```typescript
const mask = new cv.Mat();
cv.threshold(gray, mask, threshold, 255, cv.THRESH_BINARY);
```

**Parameters**:
- `threshold`: Brightness cutoff (default: 200)
  - Pixels > threshold → White (255)
  - Pixels ≤ threshold → Black (0)

**Tuning**:
- Lower threshold: Detects dimmer watermarks (may include noise)
- Higher threshold: Only very bright watermarks (may miss some)

#### 3. Morphological Dilation

**Why**: Connect nearby watermark pixels and fill small gaps.

**Implementation**:
```typescript
const kernel = cv.getStructuringElement(
  cv.MORPH_RECT,
  new cv.Size(kernelSize, kernelSize)
);
cv.dilate(mask, mask, kernel, new cv.Point(-1, -1), iterations);
```

**Parameters**:
- `kernelSize`: Size of structuring element (default: 5×5)
- `iterations`: Number of dilation passes (default: 3)

**Effect**: Expands white regions, connecting fragmented watermark parts.

**Visualization**:
```
Before Dilation:     After Dilation:
. . ■ . .            . ■ ■ ■ .
■ . . . ■     →      ■ ■ ■ ■ ■
. . ■ . .            . ■ ■ ■ .
```

#### 4. Contour Detection

**Why**: Find boundaries of connected white regions.

**Implementation**:
```typescript
const contours = new cv.MatVector();
const hierarchy = new cv.Mat();
cv.findContours(
  mask,
  contours,
  hierarchy,
  cv.RETR_EXTERNAL,
  cv.CHAIN_APPROX_SIMPLE
);
```

**Algorithm**: Suzuki border following algorithm
- `RETR_EXTERNAL`: Only outermost contours
- `CHAIN_APPROX_SIMPLE`: Compress horizontal/vertical/diagonal segments

**Output**: List of contours (polygonal boundaries).

#### 5. Bounding Rectangle Extraction

**Why**: Convert irregular contours to rectangular regions for easier processing.

**Implementation**:
```typescript
for (let i = 0; i < contours.size(); i++) {
  const rect = cv.boundingRect(contours.get(i));
  regions.push({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  });
}
```

**Result**: Array of `{x, y, width, height}` rectangles.

#### 6. Region Filtering

**Why**: Remove noise (small artifacts misidentified as watermarks).

**Implementation**:
```typescript
if (area >= minArea) {
  regions.push(rect);
}
```

**Default**: `minArea = 100` pixels (10×10 square minimum).

---

## Watermark Removal Algorithm

### High-Level Process

```
Original Image + Detected Regions
    ↓
Create Binary Mask
    ↓
Apply Inpainting
    ↓
Output: Watermark-Free Image
```

### Inpainting Methods

OpenCV provides two inpainting algorithms:

#### 1. Navier-Stokes (Default)

**Algorithm**: `cv.INPAINT_NS`

**Principle**: Fluid dynamics-based method that propagates image information from surrounding areas into the masked region using partial differential equations.

**Pros**:
- Better for larger regions
- Smoother transitions
- More natural-looking results

**Cons**:
- Slower processing
- May blur fine details

**Best For**: Text watermarks, logos, large uniform regions.

#### 2. Fast Marching Method (Telea)

**Algorithm**: `cv.INPAINT_TELEA`

**Principle**: Fast marching level set method that fills from the boundary inward.

**Pros**:
- Faster processing
- Preserves sharp edges better
- Good for small regions

**Cons**:
- May produce visible seams
- Less effective for large areas

**Best For**: Small blemishes, thin lines, quick processing.

### Implementation

#### Mask Creation

**Purpose**: Binary mask indicating which pixels to inpaint.

**Implementation**:
```typescript
const mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);

regions.forEach(region => {
  cv.rectangle(
    mask,
    new cv.Point(region.x, region.y),
    new cv.Point(region.x + region.width, region.y + region.height),
    [255, 255, 255, 255],
    -1  // Filled rectangle
  );
});
```

**Result**: White (255) where watermarks exist, black (0) elsewhere.

#### Inpainting Application

**Implementation**:
```typescript
cv.inpaint(src, mask, dst, inpaintRadius, cv.INPAINT_NS);
```

**Parameters**:
- `src`: Original image
- `mask`: Binary mask (white = inpaint)
- `dst`: Output image
- `inpaintRadius`: Neighborhood size for propagation (default: 5)

**Radius Effect**:
- Smaller radius (3): Faster, sharper, may miss details
- Larger radius (7): Slower, smoother, better blending
- Very large (>10): Diminishing returns, much slower

---

## OpenCV.js Integration

### Loading Strategy

**Challenge**: OpenCV.js is ~7MB, loads asynchronously.

**Solution**: Singleton service with promise-based loading.

```typescript
class OpenCVService {
  private cv: any = null;
  private loading: Promise<void> | null = null;

  async load(): Promise<void> {
    if (this.cv) return; // Already loaded
    if (this.loading) return this.loading; // Loading in progress

    this.loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
      script.async = true;

      script.onload = () => {
        // Wait for OpenCV initialization
        const checkInterval = setInterval(() => {
          if (window.cv && window.cv.Mat) {
            this.cv = window.cv;
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      };

      document.head.appendChild(script);
    });

    return this.loading;
  }
}
```

**Benefits**:
- Single load per session
- Concurrent calls wait for same load
- Error handling
- Type-safe wrapper

### Memory Management

**Critical**: OpenCV matrices must be explicitly deleted to prevent memory leaks.

**Pattern**:
```typescript
let src, gray, mask, kernel, contours, hierarchy;

try {
  src = cv.matFromImageData(imageData);
  gray = new cv.Mat();
  // ... processing

  return regions;

} catch (error) {
  throw error;
} finally {
  // ALWAYS cleanup
  if (src) src.delete();
  if (gray) gray.delete();
  if (mask) mask.delete();
  if (kernel) kernel.delete();
  if (contours) contours.delete();
  if (hierarchy) hierarchy.delete();
}
```

**Why**: JavaScript GC doesn't track WebAssembly memory. Manual cleanup required.

---

## Performance Optimizations

### 1. Asynchronous Processing

**Issue**: Watermark detection/removal blocks UI.

**Solution**: Wrap in async functions, use `await`.

```typescript
const results = await Promise.all(
  images.map(img => processImage(img))
);
```

### 2. Progress Tracking

**Issue**: No feedback during long operations.

**Solution**: Update progress after each stage.

```typescript
// Detection: 0-50%
await detectWatermark(imageData, config);
updateProgress(50);

// Removal: 50-100%
await removeWatermark(imageData, regions, config);
updateProgress(100);
```

### 3. Image Size Limits

**Issue**: Large images (>10MB) cause memory issues.

**Solution**: Validate file size before processing.

```typescript
if (file.size > 10 * 1024 * 1024) {
  throw new Error('File too large (max 10MB)');
}
```

### 4. Web Worker Consideration

**Current**: Processing on main thread.

**Future**: Move OpenCV to Web Worker to prevent UI blocking.

**Challenge**: OpenCV.js doesn't fully support Workers yet.

---

## Limitations and Edge Cases

### Detection Limitations

1. **Transparent Watermarks**: Brightness thresholding doesn't detect fully transparent overlays.
2. **Colored Watermarks**: Algorithm optimized for bright/white watermarks.
3. **Complex Patterns**: Intricate designs may not be fully detected.
4. **Low Contrast**: Dim watermarks on bright backgrounds hard to detect.

### Removal Limitations

1. **Large Areas**: Inpainting quality decreases for very large regions (>30% of image).
2. **Textured Backgrounds**: Inpainting assumes smooth surroundings; textures may not match perfectly.
3. **Edge Watermarks**: Watermarks near image edges have less context for inpainting.
4. **Overlapping Content**: Can't distinguish watermark from legitimate content in same area.

### Mitigation Strategies

1. **Manual Region Selection**: Allow users to manually select/adjust regions.
2. **Multiple Passes**: Run detection/removal iteratively for better results.
3. **Region Expansion**: Slightly expand detected regions to ensure complete coverage.
4. **Parameter Tuning**: Expose settings for users to adjust based on their images.

---

## Algorithm Parameters Reference

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `detectionThreshold` | 200 | 0-255 | Higher = only brightest watermarks |
| `regionSize` | 100 | 1-1000 | Minimum area to consider (pixels²) |
| `kernelSize` | 5 | 3-15 | Dilation kernel size |
| `dilationIterations` | 3 | 1-10 | Number of dilation passes |
| `inpaintRadius` | 5 | 1-15 | Neighborhood for inpainting |

---

## References

1. Bertalmio, M., et al. (2000). "Image Inpainting". *SIGGRAPH*
2. Telea, A. (2004). "An Image Inpainting Technique Based on the Fast Marching Method"
3. OpenCV Documentation: https://docs.opencv.org/4.8.0/
4. WebAssembly Best Practices: https://webassembly.org/

---

**Last Updated**: December 2024
**OpenCV Version**: 4.8.0
