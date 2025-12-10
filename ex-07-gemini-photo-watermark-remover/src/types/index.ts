// Core types for the watermark remover application

export interface ProcessedImage {
  id: string;
  name: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string | null;
  detectedRegions: Region[];
  manualRegions: Region[]; // User-selected regions
  status: 'pending' | 'processing' | 'completed' | 'error';
  error: string | null;
  editedUrl: string | null; // After crop/resize/filters
  size: number; // File size in bytes
  dimensions: { width: number; height: number };
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'auto' | 'manual-rect' | 'manual-circle';
}

export interface DetectionConfig {
  threshold: number; // Brightness threshold (0-255)
  regionSize: number; // Scan region size (px)
  kernelSize: number; // Morphological kernel size
  dilationIterations: number; // Dilation iterations
}

export interface RemovalConfig {
  inpaintRadius: number; // Inpainting radius
  method: 'INPAINT_NS' | 'INPAINT_TELEA'; // Inpainting method
}

export interface Settings {
  detectionThreshold: number; // 0-255
  regionSize: number; // px
  dilationIterations: number; // 1-10
  inpaintRadius: number; // px
  quality: 'low' | 'medium' | 'high';
}

export interface AppState {
  // Images
  images: ProcessedImage[];
  selectedImageId: string | null;

  // Processing
  isProcessing: boolean;
  processingQueue: string[];
  processingProgress: Record<string, number>;

  // Settings (persisted)
  settings: Settings;

  // UI State
  activeTab: 'upload' | 'process' | 'download';
  showSettings: boolean;
  showGuidelines: boolean;
  editingImageId: string | null;

  // Actions
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  processImage: (id: string) => Promise<void>;
  processAll: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => void;
  downloadImage: (id: string) => void;
  downloadAll: () => Promise<void>;
  setSelectedImage: (id: string | null) => void;
  setActiveTab: (tab: 'upload' | 'process' | 'download') => void;
  toggleSettings: () => void;
  toggleGuidelines: () => void;
  setEditingImage: (id: string | null) => void;
  setManualRegions: (id: string, regions: Region[]) => void;
}

// OpenCV types (augmented)
declare global {
  interface Window {
    cv: any;
  }
}

export interface OpenCVMat {
  rows: number;
  cols: number;
  delete: () => void;
}

export interface ImageEditorState {
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  rotation: number; // degrees
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  filters: {
    grayscale: boolean;
    sepia: boolean;
    blur: number; // 0-10
  };
}

export interface DownloadOptions {
  format: 'png' | 'jpg' | 'webp';
  quality?: number; // 0-1 for jpg/webp
  filename?: string;
}
