import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, ProcessedImage, Settings, DownloadOptions } from '@/types';
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
      isProcessing: false,
      processingQueue: [],
      processingProgress: {},
      settings: DEFAULT_SETTINGS,
      activeTab: 'upload',
      showSettings: false,
      showGuidelines: false,

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

      processImage: async (id: string) => {
        const state = get();
        const image = state.images.find(img => img.id === id);

        if (!image) {
          logger.error('Image not found:', id);
          return;
        }

        // Ensure OpenCV is loaded
        if (!opencvService.isLoaded()) {
          toast.loading('Loading OpenCV...');
          try {
            await opencvService.load();
            toast.dismiss();
            toast.success('OpenCV loaded!');
          } catch (error) {
            toast.dismiss();
            toast.error('Failed to load OpenCV');
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

          // Detect watermarks
          const regions = await detectWatermark(imageData, {
            threshold: state.settings.detectionThreshold,
            regionSize: state.settings.regionSize,
            kernelSize: 5,
            dilationIterations: state.settings.dilationIterations,
          });

          logger.info(`Detected ${regions.length} regions for ${image.name}`);

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

          // Update image
          set(state => ({
            images: state.images.map(img =>
              img.id === id
                ? {
                    ...img,
                    processedUrl,
                    detectedRegions: regions,
                    status: 'completed' as const,
                    error: null,
                  }
                : img
            ),
            processingProgress: { ...state.processingProgress, [id]: 100 },
          }));

          toast.success(`Processed: ${image.name}`);
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
    }),
    {
      name: 'watermark-remover-storage',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
