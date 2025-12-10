import { opencvService } from './opencv';
import { RemovalConfig, Region } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Remove watermark from image using inpainting algorithm
 * Inpainting fills the watermark regions using surrounding pixels
 *
 * @param imageData - Image data to process
 * @param regions - Regions to inpaint (detected watermarks)
 * @param config - Removal configuration
 * @returns Processed image data with watermarks removed
 */
export async function removeWatermark(
  imageData: ImageData,
  regions: Region[],
  config: RemovalConfig
): Promise<ImageData> {
  logger.info(`Removing ${regions.length} watermark regions`, config);

  if (regions.length === 0) {
    logger.warn('No regions to remove, returning original image');
    return imageData;
  }

  const cv = opencvService.getCV();

  let src: any, dst: any, mask: any;

  try {
    // 1. Convert ImageData to OpenCV Mat
    src = cv.matFromImageData(imageData);
    dst = new cv.Mat();

    // 2. Create mask from regions
    // White pixels = regions to inpaint
    // Black pixels = regions to keep
    mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);

    regions.forEach(region => {
      // Draw white rectangle for each watermark region
      cv.rectangle(
        mask,
        new cv.Point(region.x, region.y),
        new cv.Point(region.x + region.width, region.y + region.height),
        [255, 255, 255, 255],
        -1 // Filled rectangle
      );
    });

    // 3. Apply inpainting algorithm
    // cv.INPAINT_NS = Navier-Stokes method (better for larger regions)
    // cv.INPAINT_TELEA = Fast Marching method (faster, better for small regions)
    const method = config.method === 'INPAINT_NS' ? cv.INPAINT_NS : cv.INPAINT_TELEA;

    cv.inpaint(src, mask, dst, config.inpaintRadius, method);

    // 4. Convert back to ImageData
    const canvas = document.createElement('canvas');
    canvas.width = dst.cols;
    canvas.height = dst.rows;
    cv.imshow(canvas, dst);

    const ctx = canvas.getContext('2d')!;
    const resultImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    logger.info('Watermark removal completed successfully');
    return resultImageData;

  } catch (error) {
    logger.error('Watermark removal failed:', error);
    throw new Error('Failed to remove watermark');
  } finally {
    // Cleanup
    if (src) src.delete();
    if (dst) dst.delete();
    if (mask) mask.delete();
  }
}

/**
 * Remove watermark with automatic region expansion
 * Expands detected regions slightly to ensure complete removal
 *
 * @param imageData - Image data to process
 * @param regions - Regions to inpaint
 * @param config - Removal configuration
 * @param expansion - Pixels to expand regions by (default: 5)
 * @returns Processed image data
 */
export async function removeWatermarkWithExpansion(
  imageData: ImageData,
  regions: Region[],
  config: RemovalConfig,
  expansion: number = 5
): Promise<ImageData> {
  logger.info(`Removing watermarks with ${expansion}px expansion`);

  // Expand regions
  const expandedRegions = regions.map(region => ({
    x: Math.max(0, region.x - expansion),
    y: Math.max(0, region.y - expansion),
    width: Math.min(imageData.width - region.x + expansion, region.width + expansion * 2),
    height: Math.min(imageData.height - region.y + expansion, region.height + expansion * 2),
  }));

  return removeWatermark(imageData, expandedRegions, config);
}

/**
 * Preview mask for detected regions
 * Useful for showing users what will be removed
 *
 * @param imageData - Original image
 * @param regions - Regions to visualize
 * @returns ImageData with red overlay on regions
 */
export function createMaskPreview(
  imageData: ImageData,
  regions: Region[]
): ImageData {
  const cv = opencvService.getCV();

  let src: any, overlay: any, mask: any, result: any;

  try {
    src = cv.matFromImageData(imageData);
    overlay = src.clone();

    // Create mask
    mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);

    regions.forEach(region => {
      cv.rectangle(
        mask,
        new cv.Point(region.x, region.y),
        new cv.Point(region.x + region.width, region.y + region.height),
        [255, 255, 255, 255],
        -1
      );
    });

    // Create red overlay
    const red = new cv.Mat(src.rows, src.cols, src.type(), [255, 0, 0, 180]);

    // Blend where mask is white
    result = new cv.Mat();
    cv.addWeighted(src, 0.7, red, 0.3, 0, result, -1);

    // Copy result only where mask is white
    result.copyTo(src, mask);

    // Convert to ImageData
    const canvas = document.createElement('canvas');
    canvas.width = src.cols;
    canvas.height = src.rows;
    cv.imshow(canvas, src);

    const ctx = canvas.getContext('2d')!;
    const previewData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Cleanup
    red.delete();
    result.delete();

    return previewData;

  } catch (error) {
    logger.error('Failed to create mask preview:', error);
    throw error;
  } finally {
    if (src) src.delete();
    if (overlay) overlay.delete();
    if (mask) mask.delete();
  }
}
