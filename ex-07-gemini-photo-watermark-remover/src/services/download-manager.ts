import JSZip from 'jszip';
import { downloadBlob, imageDataToBlob, generateFilename } from './image-processor';
import { ProcessedImage, DownloadOptions } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Download manager for handling single and batch downloads
 */

/**
 * Download a single processed image
 */
export async function downloadSingleImage(
  image: ProcessedImage,
  options: DownloadOptions
): Promise<void> {
  if (!image.processedUrl) {
    throw new Error('Image not yet processed');
  }

  logger.info(`Downloading single image: ${image.name}`);

  try {
    // Fetch the processed image
    const response = await fetch(image.processedUrl);
    const blob = await response.blob();

    // Get filename
    const filename = options.filename || generateFilename(
      image.name,
      'no-watermark',
      options.format
    );

    // If format/quality needs conversion
    if (options.format && (options.format !== 'png' || options.quality)) {
      // Convert to ImageData first
      const img = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Convert to desired format
      const convertedBlob = await imageDataToBlob(
        imageData,
        options.format,
        options.quality || 0.9
      );

      downloadBlob(convertedBlob, filename);
    } else {
      // Download as-is
      downloadBlob(blob, filename);
    }

    logger.info(`Download completed: ${filename}`);
  } catch (error) {
    logger.error('Failed to download image:', error);
    throw new Error('Download failed');
  }
}

/**
 * Download all processed images as a ZIP file
 */
export async function downloadAllAsZip(
  images: ProcessedImage[],
  options: DownloadOptions,
  onProgress?: (progress: number) => void
): Promise<void> {
  logger.info(`Creating ZIP with ${images.length} images`);

  const zip = new JSZip();
  const processedImages = images.filter(img => img.processedUrl);

  if (processedImages.length === 0) {
    throw new Error('No processed images to download');
  }

  try {
    // Add each image to ZIP
    for (let i = 0; i < processedImages.length; i++) {
      const image = processedImages[i];

      // Fetch image
      const response = await fetch(image.processedUrl!);
      const blob = await response.blob();

      // Generate filename
      const filename = generateFilename(
        image.name,
        'no-watermark',
        options.format
      );

      // Add to ZIP
      zip.file(filename, blob);

      // Report progress
      if (onProgress) {
        onProgress(((i + 1) / processedImages.length) * 100);
      }
    }

    // Generate ZIP
    logger.info('Generating ZIP file...');
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Download ZIP
    const zipFilename = `watermark-removed-${Date.now()}.zip`;
    downloadBlob(zipBlob, zipFilename);

    logger.info(`ZIP download completed: ${zipFilename}`);
  } catch (error) {
    logger.error('Failed to create ZIP:', error);
    throw new Error('ZIP creation failed');
  }
}

/**
 * Get download statistics
 */
export function getDownloadStats(images: ProcessedImage[]): {
  total: number;
  processed: number;
  pending: number;
  failed: number;
  totalSize: number;
} {
  const processed = images.filter(img => img.status === 'completed');
  const pending = images.filter(img => img.status === 'pending' || img.status === 'processing');
  const failed = images.filter(img => img.status === 'error');

  const totalSize = processed.reduce((sum, img) => sum + img.size, 0);

  return {
    total: images.length,
    processed: processed.length,
    pending: pending.length,
    failed: failed.length,
    totalSize,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
