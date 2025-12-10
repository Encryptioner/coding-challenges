import { Download, Package, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/button';

export function DownloadManager() {
  const { images, downloadImage, downloadAll } = useAppStore();

  const processedImages = images.filter(img => img.status === 'completed');

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
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Download Results</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {processedImages.length} image(s) ready •{' '}
            {(totalSize / 1024 / 1024).toFixed(2)} MB total
          </p>
        </div>

        <Button onClick={() => downloadAll()} size="lg">
          <Package className="w-4 h-4 mr-2" />
          Download All as ZIP
        </Button>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {processedImages.map((image) => (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-secondary/20"
          >
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
                  {image.detectedRegions.length} watermark(s) removed
                </p>
              </div>

              <Button
                onClick={() => downloadImage(image.id)}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
