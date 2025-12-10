import { useEffect, useRef, useState } from 'react';
import { X, Square, Circle, Undo, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useAppStore } from '@/store/useAppStore';
import { Region } from '@/types';
import { logger } from '@/utils/logger';

type SelectionTool = 'rect' | 'circle';

interface SelectionState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function ImageEditor() {
  const { images, editingImageId, setEditingImage, setManualRegions } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<SelectionTool>('rect');
  const [regions, setRegions] = useState<Region[]>([]);
  const [selection, setSelection] = useState<SelectionState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [imageScale, setImageScale] = useState(1);

  const image = images.find(img => img.id === editingImageId);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = image.originalUrl;

    img.onload = () => {
      // Calculate scale to fit canvas
      const maxWidth = canvas.parentElement?.clientWidth || 800;
      const maxHeight = 600;

      const scaleX = maxWidth / img.width;
      const scaleY = maxHeight / img.height;
      const scale = Math.min(scaleX, scaleY, 1);

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      setImageScale(scale);

      drawCanvas();
    };

    function drawCanvas() {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw existing regions
      regions.forEach(region => {
        drawRegion(ctx, region);
      });

      // Draw current selection
      if (selection.isDrawing) {
        const tempRegion: Region = {
          x: Math.min(selection.startX, selection.currentX),
          y: Math.min(selection.startY, selection.currentY),
          width: Math.abs(selection.currentX - selection.startX),
          height: Math.abs(selection.currentY - selection.startY),
          type: tool === 'rect' ? 'manual-rect' : 'manual-circle',
        };
        drawRegion(ctx, tempRegion, true);
      }
    }

    drawCanvas();
  }, [image, regions, selection, tool]);

  const drawRegion = (ctx: CanvasRenderingContext2D, region: Region, isActive = false) => {
    ctx.save();

    // Set style
    ctx.strokeStyle = isActive ? '#3b82f6' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.fillStyle = isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)';

    if (region.type === 'manual-circle') {
      // Draw ellipse
      const centerX = region.x + region.width / 2;
      const centerY = region.y + region.height / 2;
      const radiusX = region.width / 2;
      const radiusY = region.height / 2;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else {
      // Draw rectangle
      ctx.fillRect(region.x, region.y, region.width, region.height);
      ctx.strokeRect(region.x, region.y, region.width, region.height);
    }

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelection({
      isDrawing: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selection.isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelection(prev => ({
      ...prev,
      currentX: x,
      currentY: y,
    }));
  };

  const handleMouseUp = () => {
    if (!selection.isDrawing) return;

    const width = Math.abs(selection.currentX - selection.startX);
    const height = Math.abs(selection.currentY - selection.startY);

    // Only add region if it has meaningful size
    if (width > 10 && height > 10) {
      const newRegion: Region = {
        x: Math.min(selection.startX, selection.currentX) / imageScale,
        y: Math.min(selection.startY, selection.currentY) / imageScale,
        width: width / imageScale,
        height: height / imageScale,
        type: tool === 'rect' ? 'manual-rect' : 'manual-circle',
      };

      setRegions(prev => [...prev, newRegion]);
      logger.info('Added region:', newRegion);
    }

    setSelection({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  };

  const handleUndo = () => {
    setRegions(prev => prev.slice(0, -1));
  };

  const handleSave = () => {
    if (!editingImageId) return;

    setManualRegions(editingImageId, regions);
    setEditingImage(null);
  };

  const handleCancel = () => {
    setEditingImage(null);
  };

  if (!image) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Select Watermark Region</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {image.name} - Draw to select watermarked areas
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b border-border bg-secondary/30">
          <div className="flex gap-2">
            <Button
              variant={tool === 'rect' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rect')}
            >
              <Square className="w-4 h-4 mr-2" />
              Rectangle
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
            >
              <Circle className="w-4 h-4 mr-2" />
              Circle
            </Button>
          </div>

          <div className="flex-1" />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={regions.length === 0}
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={regions.length === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Apply ({regions.length})
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-secondary/10">
          <div className="flex justify-center items-center min-h-full">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border border-border cursor-crosshair rounded shadow-lg"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground">
            <strong>Instructions:</strong> Click and drag to select watermarked regions.
            For Gemini watermarks, typically found in the bottom-right corner.
            Use circle tool for rounded watermarks, rectangle for text watermarks.
          </p>
        </div>
      </div>
    </div>
  );
}
