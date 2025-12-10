import { opencvService } from './opencv';
import { DetectionConfig, Region } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Detect watermark regions in an image using brightness thresholding
 * and morphological operations
 *
 * @param imageData - Image data to process
 * @param config - Detection configuration
 * @returns Array of detected regions
 */
export async function detectWatermark(
  imageData: ImageData,
  config: DetectionConfig
): Promise<Region[]> {
  logger.info('Starting watermark detection', config);

  const cv = opencvService.getCV();

  // OpenCV matrices for processing
  let src: any, gray: any, mask: any, kernel: any, contours: any, hierarchy: any;

  try {
    // 1. Convert ImageData to OpenCV Mat
    src = cv.matFromImageData(imageData);
    gray = new cv.Mat();

    // 2. Convert to grayscale for easier processing
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 3. Apply brightness threshold
    // Pixels brighter than threshold become white (255)
    mask = new cv.Mat();
    cv.threshold(gray, mask, config.threshold, 255, cv.THRESH_BINARY);

    // 4. Morphological operations (dilation) to connect nearby bright regions
    // This helps fill gaps in watermarks
    kernel = cv.getStructuringElement(
      cv.MORPH_RECT,
      new cv.Size(config.kernelSize, config.kernelSize)
    );
    cv.dilate(
      mask,
      mask,
      kernel,
      new cv.Point(-1, -1),
      config.dilationIterations
    );

    // 5. Find contours (boundaries of bright regions)
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(
      mask,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    // 6. Convert contours to regions
    const regions: Region[] = [];
    const minArea = config.regionSize; // Minimum area to consider

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      // Filter out very small regions (likely noise)
      if (area >= minArea) {
        const rect = cv.boundingRect(contour);
        regions.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
      }

      contour.delete();
    }

    logger.info(`Detected ${regions.length} watermark regions`);
    return regions;

  } catch (error) {
    logger.error('Watermark detection failed:', error);
    throw new Error('Failed to detect watermark regions');
  } finally {
    // Cleanup OpenCV matrices to prevent memory leaks
    if (src) src.delete();
    if (gray) gray.delete();
    if (mask) mask.delete();
    if (kernel) kernel.delete();
    if (contours) contours.delete();
    if (hierarchy) hierarchy.delete();
  }
}

/**
 * Detect watermark in a specific region (e.g., bottom-right corner)
 * Useful for watermarks that are always in the same position
 *
 * @param imageData - Image data to process
 * @param region - Region to scan for watermark
 * @param config - Detection configuration
 * @returns Detected regions within the specified area
 */
export async function detectWatermarkInRegion(
  imageData: ImageData,
  region: Region,
  config: DetectionConfig
): Promise<Region[]> {
  logger.info('Detecting watermark in specific region', region);

  const cv = opencvService.getCV();

  let src: any, roi: any, roiImageData: any;

  try {
    // Extract region of interest
    src = cv.matFromImageData(imageData);
    const rect = new cv.Rect(region.x, region.y, region.width, region.height);
    roi = src.roi(rect);

    // Convert ROI back to ImageData
    const canvas = document.createElement('canvas');
    canvas.width = roi.cols;
    canvas.height = roi.rows;
    cv.imshow(canvas, roi);

    const ctx = canvas.getContext('2d')!;
    roiImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Detect in ROI
    const detectedRegions = await detectWatermark(roiImageData, config);

    // Adjust coordinates to original image
    const adjustedRegions = detectedRegions.map(r => ({
      x: r.x + region.x,
      y: r.y + region.y,
      width: r.width,
      height: r.height,
    }));

    return adjustedRegions;

  } catch (error) {
    logger.error('Region-specific detection failed:', error);
    throw new Error('Failed to detect watermark in region');
  } finally {
    if (src) src.delete();
    if (roi) roi.delete();
  }
}

/**
 * Auto-detect watermark in bottom-right corner
 * Common watermark position
 */
export async function detectBottomRightWatermark(
  imageData: ImageData,
  config: DetectionConfig
): Promise<Region[]> {
  const { width, height } = imageData;

  // Scan bottom-right 25% of image
  const scanRegion: Region = {
    x: Math.floor(width * 0.75),
    y: Math.floor(height * 0.75),
    width: Math.floor(width * 0.25),
    height: Math.floor(height * 0.25),
  };

  return detectWatermarkInRegion(imageData, scanRegion, config);
}
