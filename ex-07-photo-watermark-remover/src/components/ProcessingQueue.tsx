import { Check, X, Loader2, Trash2, Edit, Info } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/button';

export function ProcessingQueue() {
  const { images, processImage, processAll, removeImage, isProcessing, setEditingImage } = useAppStore();

  // Filter to show only pending, processing, and error images
  const processingImages = images.filter(img =>
    img.status === 'pending' || img.status === 'processing' || img.status === 'error'
  );

  if (processingImages.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground">
          {images.length > 0
            ? 'All images processed! Go to Download tab to view results.'
            : 'No images uploaded yet'}
        </p>
      </div>
    );
  }

  const pendingCount = processingImages.filter(img => img.status === 'pending').length;
  const processingCount = processingImages.filter(img => img.status === 'processing').length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Processing Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {processingImages.length} image(s) to process
            {processingCount > 0 && ` (${processingCount} in progress)`}
          </p>
        </div>

        {pendingCount > 0 && (
          <Button
            onClick={() => processAll()}
            disabled={isProcessing}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Process All (${pendingCount})`
            )}
          </Button>
        )}
      </div>

      {/* Instructions Banner */}
      <div className="mb-6 p-4 bg-blue-950/30 border border-blue-800/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="text-blue-200 font-medium">How to Remove Watermarks:</p>
            <ol className="text-blue-300/80 list-decimal list-inside space-y-0.5">
              <li><strong className="text-blue-200">Use the "Select Region" button</strong> to manually select watermark areas (recommended for best results)</li>
              <li><strong className="text-blue-200">Or click "Process"</strong> to auto-detect watermarks (works for bright/high-contrast watermarks)</li>
              <li>After processing, download results from the Download tab</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Image List */}
      <div className="space-y-3">
        {processingImages.map((image) => (
          <div
            key={image.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-secondary/30 rounded-lg border border-border"
          >
            {/* Top row on mobile: Thumbnail + Info */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded bg-secondary flex-shrink-0 overflow-hidden">
                <img
                  src={image.originalUrl}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{image.name}</p>
                <p className="text-xs text-muted-foreground">
                  {image.dimensions.width} × {image.dimensions.height}
                  {' • '}
                  {(image.size / 1024 / 1024).toFixed(2)} MB
                </p>

                {/* Error message */}
                {image.error && (
                  <p className="text-xs text-destructive mt-1">{image.error}</p>
                )}

                {/* Detected/Manual regions */}
                {image.manualRegions.length > 0 && (
                  <p className="text-xs text-green-500 mt-1">
                    ✓ {image.manualRegions.length} region(s) manually selected
                  </p>
                )}
                {image.detectedRegions.length > 0 && image.manualRegions.length === 0 && (
                  <p className="text-xs text-blue-400 mt-1">
                    Auto-detected {image.detectedRegions.length} region(s) after processing
                  </p>
                )}
                {image.manualRegions.length === 0 && image.detectedRegions.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠ No manual selection
                  </p>
                )}
              </div>
            </div>

            {/* Bottom row on mobile: Status + Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:flex-shrink-0">
              {/* Status indicator on mobile, actions on desktop */}
              <div className="flex items-center gap-2 flex-wrap">
                {(image.status === 'pending' || image.status === 'error') && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingImage(image.id)}
                      disabled={isProcessing}
                      title="Manually select the watermark region to remove"
                      className="flex-shrink-0"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      <span className="inline">Select Region</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => processImage(image.id)}
                      disabled={isProcessing}
                      title="Process this image to remove watermark"
                      className="flex-shrink-0"
                    >
                      Process
                    </Button>
                  </>
                )}

                {image.status === 'processing' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                  </div>
                )}

                {image.status === 'completed' && (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Done</span>
                  </div>
                )}

                {image.status === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Failed</span>
                  </div>
                )}
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeImage(image.id)}
                className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                title="Remove image"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
