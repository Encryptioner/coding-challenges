import { logger } from '@/utils/logger';
import compress from 'browser-image-compression';

/**
 * Image processing utilities for file handling, validation, and conversion
 */

// Supported image formats
export const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported format: ${file.type}. Supported: PNG, JPG, JPEG, WebP`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB`,
    };
  }

  return { valid: true };
}

/**
 * Load image file and get ImageData
 */
export async function loadImageData(file: File): Promise<{
  imageData: ImageData;
  dimensions: { width: number; height: number };
  url: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Get ImageData
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Create URL
          const url = URL.createObjectURL(file);

          resolve({
            imageData,
            dimensions: { width: img.width, height: img.height },
            url,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert ImageData to Blob
 */
export async function imageDataToBlob(
  imageData: ImageData,
  format: 'png' | 'jpg' | 'webp' = 'png',
  quality: number = 0.9
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Convert ImageData to data URL
 */
export function imageDataToDataURL(
  imageData: ImageData,
  format: 'png' | 'jpg' | 'webp' = 'png',
  quality: number = 0.9
): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.putImageData(imageData, 0, 0);

  const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Compress image file
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1
): Promise<File> {
  try {
    logger.info(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const options = {
      maxSizeMB,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
    };

    const compressedFile = await compress(file, options);

    logger.info(`Compressed to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

    return compressedFile;
  } catch (error) {
    logger.error('Compression failed:', error);
    return file; // Return original if compression fails
  }
}

/**
 * Generate unique filename
 */
export function generateFilename(
  originalName: string,
  suffix: string = 'processed',
  format?: string
): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const ext = format || originalName.split('.').pop() || 'png';

  return `${nameWithoutExt}-${suffix}.${ext}`;
}

/**
 * Download file from blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  logger.info(`Downloaded: ${filename}`);
}

/**
 * Download ImageData as file
 */
export async function downloadImageData(
  imageData: ImageData,
  filename: string,
  format: 'png' | 'jpg' | 'webp' = 'png',
  quality: number = 0.9
): Promise<void> {
  const blob = await imageDataToBlob(imageData, format, quality);
  downloadBlob(blob, filename);
}
