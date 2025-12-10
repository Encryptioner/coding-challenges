import { Check, X, Loader2, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/button';

export function ProcessingQueue() {
  const { images, processImage, processAll, removeImage, isProcessing } = useAppStore();

  if (images.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground">No images uploaded yet</p>
      </div>
    );
  }

  const pendingCount = images.filter(img => img.status === 'pending').length;
  const completedCount = images.filter(img => img.status === 'completed').length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Processing Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {completedCount} of {images.length} processed
          </p>
        </div>

        {pendingCount > 0 && (
          <Button
            onClick={() => processAll()}
            disabled={isProcessing}
            size="lg"
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

      {/* Image List */}
      <div className="space-y-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border"
          >
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

              {/* Detected regions */}
              {image.detectedRegions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {image.detectedRegions.length} watermark region(s) detected
                </p>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {image.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => processImage(image.id)}
                  disabled={isProcessing}
                >
                  Process
                </Button>
              )}

              {image.status === 'processing' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              )}

              {image.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <Check className="w-4 h-4" />
                  Done
                </div>
              )}

              {image.status === 'error' && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <X className="w-4 h-4" />
                  Failed
                </div>
              )}

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeImage(image.id)}
                className="hover:bg-destructive/10 hover:text-destructive"
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
