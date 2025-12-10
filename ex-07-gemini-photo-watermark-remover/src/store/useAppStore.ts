import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, ProcessedImage, Settings, DownloadOptions, Region } from '@/types';
import { validateImageFile, loadImageData } from '@/services/image-processor';
import { detectWatermark } from '@/services/watermark-detector';
import { removeWatermark } from '@/services/watermark-remover';
import { downloadSingleImage, downloadAllAsZip } from '@/services/download-manager';
import { opencvService } from '@/services/opencv';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  detectionThreshold: 200,
  regionSize: 100,
  dilationIterations: 3,
  inpaintRadius: 5,
  quality: 'high',
};

// Quality presets
const QUALITY_PRESETS = {
  low: { detectionThreshold: 180, inpaintRadius: 3 },
  medium: { detectionThreshold: 200, inpaintRadius: 5 },
  high: { detectionThreshold: 220, inpaintRadius: 7 },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // State
      images: [],
      selectedImageId: null,
      currentSessionId: Date.now().toString(),
      isProcessing: false,
      processingQueue: [],
      processingProgress: {},
      settings: DEFAULT_SETTINGS,
      activeTab: 'upload',
      showSettings: false,
      showGuidelines: false,
      editingImageId: null,

      // Actions
      addImages: async (files: File[]) => {
        logger.info(`Adding ${files.length} images`);

        const newImages: ProcessedImage[] = [];

        for (const file of files) {
          // Validate
          const validation = validateImageFile(file);
          if (!validation.valid) {
            toast.error(`${file.name}: ${validation.error}`);
            continue;
          }

          try {
            // Load image
            const { dimensions, url } = await loadImageData(file);

            // Create processed image object
            const image: ProcessedImage = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              originalFile: file,
              originalUrl: url,
              processedUrl: null,
              detectedRegions: [],
              manualRegions: [],
              status: 'pending',
              error: null,
              editedUrl: null,
              size: file.size,
              dimensions,
            };

            newImages.push(image);
          } catch (error) {
            logger.error(`Failed to load ${file.name}:`, error);
            toast.error(`Failed to load ${file.name}`);
          }
        }

        set(state => ({
          images: [...state.images, ...newImages],
        }));

        toast.success(`Added ${newImages.length} image(s)`);

        // Auto-switch to process tab
        if (newImages.length > 0) {
          set({ activeTab: 'process' });
        }
      },

      removeImage: (id: string) => {
        set(state => {
          const image = state.images.find(img => img.id === id);
          if (image) {
            // Revoke URLs to free memory
            if (image.originalUrl) URL.revokeObjectURL(image.originalUrl);
            if (image.processedUrl) URL.revokeObjectURL(image.processedUrl);
            if (image.editedUrl) URL.revokeObjectURL(image.editedUrl);
          }

          return {
            images: state.images.filter(img => img.id !== id),
            selectedImageId: state.selectedImageId === id ? null : state.selectedImageId,
          };
        });

        toast.success('Image removed');
      },

      deleteProcessedImage: (id: string) => {
        set(state => {
          const image = state.images.find(img => img.id === id);
          if (image) {
            // Revoke URLs to free memory
            if (image.originalUrl) URL.revokeObjectURL(image.originalUrl);
            if (image.processedUrl) URL.revokeObjectURL(image.processedUrl);
            if (image.editedUrl) URL.revokeObjectURL(image.editedUrl);
          }

          return {
            images: state.images.filter(img => img.id !== id),
            selectedImageId: state.selectedImageId === id ? null : state.selectedImageId,
          };
        });

        logger.info(`Deleted processed image: ${id}`);
        toast.success('Result deleted');
      },

      processImage: async (id: string) => {
        const state = get();
        const image = state.images.find(img => img.id === id);

        if (!image) {
          logger.error('Image not found:', id);
          return;
        }

        // Ensure OpenCV is loaded
        if (!opencvService.isLoaded()) {
          try {
            await opencvService.load();
            logger.info('OpenCV loaded successfully');
          } catch (error) {
            toast.error('Failed to load OpenCV - cannot process image');
            logger.error('OpenCV load failed:', error);
            return;
          }
        }

        // Update status
        set(state => ({
          images: state.images.map(img =>
            img.id === id ? { ...img, status: 'processing' as const } : img
          ),
          processingProgress: { ...state.processingProgress, [id]: 0 },
        }));

        try {
          // Load image data
          const { imageData } = await loadImageData(image.originalFile);
          set(state => ({
            processingProgress: { ...state.processingProgress, [id]: 25 },
          }));

          // Use manual regions if available, otherwise detect automatically
          let regions: any[];

          if (image.manualRegions.length > 0) {
            logger.info(`Using ${image.manualRegions.length} manual regions for ${image.name}`);
            regions = image.manualRegions;
          } else {
            // Detect watermarks automatically
            regions = await detectWatermark(imageData, {
              threshold: state.settings.detectionThreshold,
              regionSize: state.settings.regionSize,
              kernelSize: 5,
              dilationIterations: state.settings.dilationIterations,
            });
            logger.info(`Detected ${regions.length} auto regions for ${image.name}`);
          }

          set(state => ({
            processingProgress: { ...state.processingProgress, [id]: 50 },
          }));

          // Remove watermarks
          const processedImageData = await removeWatermark(imageData, regions, {
            inpaintRadius: state.settings.inpaintRadius,
            method: 'INPAINT_NS',
          });

          set(state => ({
            processingProgress: { ...state.processingProgress, [id]: 75 },
          }));

          // Convert to URL
          const canvas = document.createElement('canvas');
          canvas.width = processedImageData.width;
          canvas.height = processedImageData.height;
          const ctx = canvas.getContext('2d')!;
          ctx.putImageData(processedImageData, 0, 0);

          const processedUrl = canvas.toDataURL('image/png');

          // Convert original image to Data URL for persistence
          const originalCanvas = document.createElement('canvas');
          originalCanvas.width = image.dimensions.width;
          originalCanvas.height = image.dimensions.height;
          const originalCtx = originalCanvas.getContext('2d')!;

          const originalImg = new Image();
          originalImg.onload = () => {
            originalCtx.drawImage(originalImg, 0, 0);
            const originalDataUrl = originalCanvas.toDataURL('image/png');

            // Update image
            set(state => ({
              images: state.images.map(img =>
                img.id === id
                  ? {
                      ...img,
                      originalUrl: originalDataUrl, // Use Data URL instead of blob URL
                      processedUrl,
                      detectedRegions: regions,
                      status: 'completed' as const,
                      error: null,
                      processedAt: Date.now(),
                      sessionId: state.currentSessionId,
                    }
                  : img
              ),
              processingProgress: { ...state.processingProgress, [id]: 100 },
            }));
          };
          originalImg.src = image.originalUrl;

          toast.success(`Processed: ${image.name}`);

          // Auto-switch to download tab immediately after successful processing
          set({ activeTab: 'download' });
        } catch (error) {
          logger.error('Processing failed:', error);

          set(state => ({
            images: state.images.map(img =>
              img.id === id
                ? {
                    ...img,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Processing failed',
                  }
                : img
            ),
          }));

          toast.error(`Failed to process ${image.name}`);
        }
      },

      processAll: async () => {
        const { images, processImage } = get();
        const pendingImages = images.filter(img => img.status === 'pending');

        if (pendingImages.length === 0) {
          toast.info('No images to process');
          return;
        }

        set({ isProcessing: true });
        toast.loading(`Processing ${pendingImages.length} images...`);

        for (const image of pendingImages) {
          await processImage(image.id);
        }

        set({ isProcessing: false });
        toast.dismiss();
        toast.success('All images processed!');
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        }));

        // Apply quality preset if changed
        if (newSettings.quality) {
          const preset = QUALITY_PRESETS[newSettings.quality];
          set(state => ({
            settings: { ...state.settings, ...preset },
          }));
        }

        toast.success('Settings updated');
      },

      downloadImage: async (id: string) => {
        const { images } = get();
        const image = images.find(img => img.id === id);

        if (!image || !image.processedUrl) {
          toast.error('Image not ready for download');
          return;
        }

        try {
          const options: DownloadOptions = {
            format: 'png',
            quality: 0.9,
          };

          await downloadSingleImage(image, options);
          toast.success('Downloaded!');
        } catch (error) {
          logger.error('Download failed:', error);
          toast.error('Download failed');
        }
      },

      downloadAll: async () => {
        const { images } = get();
        const processedImages = images.filter(img => img.processedUrl);

        if (processedImages.length === 0) {
          toast.error('No processed images to download');
          return;
        }

        try {
          const options: DownloadOptions = {
            format: 'png',
            quality: 0.9,
          };

          toast.loading('Creating ZIP...');

          await downloadAllAsZip(processedImages, options, (progress) => {
            logger.info(`ZIP progress: ${progress.toFixed(0)}%`);
          });

          toast.dismiss();
          toast.success('Downloaded ZIP!');
        } catch (error) {
          logger.error('ZIP download failed:', error);
          toast.dismiss();
          toast.error('Failed to create ZIP');
        }
      },

      setSelectedImage: (id: string | null) => {
        set({ selectedImageId: id });
      },

      setActiveTab: (tab: 'upload' | 'process' | 'download') => {
        set({ activeTab: tab });
      },

      toggleSettings: () => {
        set(state => ({ showSettings: !state.showSettings }));
      },

      toggleGuidelines: () => {
        set(state => ({ showGuidelines: !state.showGuidelines }));
      },

      setEditingImage: (id: string | null) => {
        set({ editingImageId: id });
      },

      setManualRegions: (id: string, regions: Region[]) => {
        set(state => ({
          images: state.images.map(img =>
            img.id === id
              ? { ...img, manualRegions: regions, status: 'pending' as const }
              : img
          ),
        }));

        logger.info(`Set ${regions.length} manual regions for image ${id}`);
        toast.success(`${regions.length} region(s) selected`);
      },

      clearAllResults: () => {
        set(state => {
          // Revoke all URLs to free memory
          state.images.forEach(img => {
            if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
            if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
            if (img.editedUrl) URL.revokeObjectURL(img.editedUrl);
          });

          return {
            images: [],
          };
        });

        toast.success('All results cleared');
        logger.info('All processed images cleared');
      },
    }),
    {
      name: 'watermark-remover-storage',
      partialize: (state) => ({
        // Persist completed images and settings, but exclude File objects
        images: state.images.filter(img => img.status === 'completed').map(img => ({
          ...img,
          name: img.name,
          originalUrl: img.originalUrl, // Now also persisted as Data URL
          processedUrl: img.processedUrl, // Data URLs can be persisted
          detectedRegions: img.detectedRegions,
          manualRegions: img.manualRegions,
          status: img.status,
          error: img.error,
          size: img.size,
          dimensions: img.dimensions,
          processedAt: img.processedAt,
          sessionId: img.sessionId,
        })),
        settings: state.settings,
      }),
      // Custom hydration to restore File objects
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Regenerate File objects for processed images (using placeholder)
        state.images = state.images.map(img => ({
          ...img,
          originalFile: new File([], img.name), // Empty file placeholder
        }));
      },
    }
  )
);
