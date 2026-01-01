import { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/button';

export function ImageUploader() {
  const { addImages, images } = useAppStore();

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        addImages(files);
      }
    },
    [addImages]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        addImages(files);
      }
    },
    [addImages]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Drop images here or click to browse
            </h3>
            <p className="text-sm text-muted-foreground mb-1">
              Supports PNG, JPG, JPEG, WebP (max 10MB each)
            </p>
            <p className="text-xs text-muted-foreground">
              100% client-side • No uploads • Privacy-friendly
            </p>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('file-input')?.click();
            }}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Select Images
          </Button>
        </div>

        <input
          id="file-input"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {images.length} image(s) uploaded
          </p>
        </div>
      )}
    </div>
  );
}
