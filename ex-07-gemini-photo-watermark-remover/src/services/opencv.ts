import { logger } from '@/utils/logger';

/**
 * OpenCV.js loading and initialization service
 * Handles dynamic loading of OpenCV.js from CDN and provides a singleton instance
 */
class OpenCVService {
  private cv: any = null;
  private loading: Promise<void> | null = null;
  private loadCallbacks: Array<() => void> = [];

  /**
   * Load OpenCV.js from CDN
   * Resolves when OpenCV is fully loaded and initialized
   */
  async load(): Promise<void> {
    // Already loaded
    if (this.cv) {
      logger.info('OpenCV already loaded');
      return;
    }

    // Loading in progress - wait for it
    if (this.loading) {
      logger.info('OpenCV load already in progress, waiting...');
      return this.loading;
    }

    logger.info('Starting OpenCV.js load from CDN...');

    this.loading = new Promise((resolve, reject) => {
      // Check if already loaded by another script
      if (window.cv && window.cv.Mat) {
        this.cv = window.cv;
        logger.info('OpenCV found on window object, setting instance');
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
      script.async = true;
      script.type = 'text/javascript';

      // Handle script load
      script.onload = () => {
        logger.info('OpenCV script loaded, waiting for initialization...');

        // OpenCV needs time to initialize after script loads
        const checkInterval = setInterval(() => {
          if (window.cv && window.cv.Mat) {
            this.cv = window.cv;
            clearInterval(checkInterval);
            logger.info('OpenCV initialized successfully, instance set');

            // Call any pending callbacks
            this.loadCallbacks.forEach(cb => cb());
            this.loadCallbacks = [];

            resolve();
          }
        }, 100);

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!this.cv) {
            clearInterval(checkInterval);
            reject(new Error('OpenCV initialization timed out'));
          }
        }, 30000);
      };

      // Handle script error
      script.onerror = () => {
        const error = new Error('Failed to load OpenCV.js from CDN');
        logger.error('OpenCV load failed:', error);
        reject(error);
      };

      // Append to document
      document.head.appendChild(script);
    });

    return this.loading;
  }

  /**
   * Get the OpenCV instance
   * Throws error if not loaded
   */
  getCV(): any {
    if (!this.cv) {
      throw new Error('OpenCV not loaded. Call load() first.');
    }
    return this.cv;
  }

  /**
   * Check if OpenCV is loaded
   */
  isLoaded(): boolean {
    // Check both our instance and window object
    const hasInstance = this.cv !== null;
    const hasWindowCV = window.cv && typeof window.cv === 'object';
    const hasMat = hasWindowCV && window.cv.Mat;

    logger.debug(`OpenCV isLoaded check: instance=${hasInstance}, window.cv=${hasWindowCV}, Mat=${hasMat}`);

    // If we don't have instance but window has it, set our instance
    if (!hasInstance && hasWindowCV && hasMat) {
      this.cv = window.cv;
      logger.info('OpenCV instance restored from window object');
    }

    return this.cv !== null;
  }

  /**
   * Register a callback to run when OpenCV is loaded
   * If already loaded, callback runs immediately
   */
  onLoad(callback: () => void): void {
    if (this.cv) {
      callback();
    } else {
      this.loadCallbacks.push(callback);
    }
  }

  /**
   * Get OpenCV version
   */
  getVersion(): string {
    if (!this.cv) return 'Not loaded';
    return this.cv.getBuildInformation ? 'OpenCV 4.8.0' : 'Unknown';
  }
}

// Export singleton instance
export const opencvService = new OpenCVService();
