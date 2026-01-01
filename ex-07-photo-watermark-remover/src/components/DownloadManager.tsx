import { useState } from 'react';
import { Download, Package, Image as ImageIcon, Eye, X, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/button';
import { ProcessedImage } from '@/types';

export function DownloadManager() {
  const { images, downloadImage, downloadAll, currentSessionId, deleteProcessedImage, clearAllResults } = useAppStore();
  const [previewImage, setPreviewImage] = useState<ProcessedImage | null>(null);
  const [showBefore, setShowBefore] = useState(true);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  const processedImages = images.filter(img => img.status === 'completed');

  // Separate new results (current session) from previous results
  const newResults = processedImages.filter(img => img.sessionId === currentSessionId);
  const previousResults = processedImages.filter(img => img.sessionId !== currentSessionId && img.sessionId);

  // Helper function to handle delete with confirmation
  const handleDelete = (imageId: string) => {
    if (deletingImageId === imageId) {
      // Confirm delete
      deleteProcessedImage(imageId);
      setDeletingImageId(null);
    } else {
      // Show confirmation
      setDeletingImageId(imageId);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setDeletingImageId(null), 3000);
    }
  };

  // Image card component
  const ImageCard = ({ image, isNew = false }: { image: ProcessedImage; isNew?: boolean }) => (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-secondary/20">
      {/* Badge for new results */}
      {isNew && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-green-600 text-white text-xs rounded font-medium">
          NEW
        </div>
      )}

      {/* Before/After Images */}
      <div className="grid grid-cols-2 gap-1 p-2">
        {/* Original */}
        <div className="relative">
          <img
            src={image.originalUrl}
            alt={`${image.name} - original`}
            className="w-full h-48 object-cover rounded"
          />
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
            Before
          </div>
        </div>

        {/* Processed */}
        <div className="relative">
          <img
            src={image.processedUrl || ''}
            alt={`${image.name} - processed`}
            className="w-full h-48 object-cover rounded"
          />
          <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
            After
          </div>
        </div>
      </div>

      {/* Info & Actions */}
      <div className="p-4 space-y-3">
        <div>
          <p className="font-medium truncate">{image.name}</p>
          <p className="text-xs text-muted-foreground">
            {image.manualRegions.length > 0
              ? `${image.manualRegions.length} manual region(s) selected`
              : `${image.detectedRegions.length} watermark(s) removed`
            }
          </p>
          {image.processedAt && (
            <p className="text-xs text-muted-foreground">
              Processed {new Date(image.processedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setPreviewImage(image)}
            className="flex-1"
            variant="outline"
            size="sm"
          >
            <Eye className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            onClick={() => downloadImage(image.id)}
            className="flex-1"
            variant="default"
            size="sm"
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <Button
            onClick={() => handleDelete(image.id)}
            variant="ghost"
            size="icon"
            className={deletingImageId === image.id ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-destructive/10 hover:text-destructive'}
            title={deletingImageId === image.id ? 'Click again to confirm delete' : 'Delete result'}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Delete confirmation */}
        {deletingImageId === image.id && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs">
            <p className="font-medium text-red-900 dark:text-red-300 mb-1">Delete this result?</p>
            <p className="text-red-700 dark:text-red-400">Click again to confirm</p>
          </div>
        )}
      </div>
    </div>
  );

  if (processedImages.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No processed images yet</h3>
        <p className="text-sm text-muted-foreground">
          Process some images first to download them
        </p>
      </div>
    );
  }

  const totalSize = processedImages.reduce((sum, img) => sum + img.size, 0);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Download Results</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {processedImages.length} image(s) ready •{' '}
            {(totalSize / 1024 / 1024).toFixed(2)} MB total
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {processedImages.length > 0 && (
            <Button
              onClick={() => setShowClearConfirmation(true)}
              variant="destructive"
              size="lg"
              className="flex-1 sm:flex-initial"
            >
              <Trash2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
          <Button onClick={() => downloadAll()} size="lg" className="flex-1 sm:flex-initial">
            <Package className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Download All as ZIP</span>
          </Button>
        </div>
      </div>

      {/* New Results Section */}
      {newResults.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold">New Results</h3>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded font-medium">
              {newResults.length} image(s)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newResults.map((image) => (
              <ImageCard key={image.id} image={image} isNew={true} />
            ))}
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Clear All Results?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete all {processedImages.length} processed images.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  clearAllResults();
                  setShowClearConfirmation(false);
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Results Section */}
      {previousResults.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold">Previous Results</h3>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded font-medium">
              {previousResults.length} image(s)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {previousResults.map((image) => (
              <ImageCard key={image.id} image={image} isNew={false} />
            ))}
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white">{previewImage.name}</h3>
              <p className="text-sm text-gray-400">
                {previewImage.dimensions.width} × {previewImage.dimensions.height}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {/* Toggle Before/After */}
              <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={showBefore ? 'default' : 'ghost'}
                  onClick={() => setShowBefore(true)}
                  className="text-xs"
                >
                  Before
                </Button>
                <Button
                  size="sm"
                  variant={!showBefore ? 'default' : 'ghost'}
                  onClick={() => setShowBefore(false)}
                  className="text-xs"
                >
                  After
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewImage(null)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Image Preview */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img
              src={showBefore ? previewImage.originalUrl : previewImage.processedUrl || ''}
              alt={showBefore ? 'Before' : 'After'}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Footer */}
          <div className="p-4 bg-black/50 border-t border-white/10 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPreviewImage(null)}
              className="bg-white/5 hover:bg-white/10 text-white border-white/20"
            >
              Close Preview
            </Button>
            <Button
              onClick={() => {
                downloadImage(previewImage.id);
                setPreviewImage(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download This Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
