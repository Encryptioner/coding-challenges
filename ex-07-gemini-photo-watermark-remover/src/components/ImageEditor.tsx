import { useEffect, useRef, useState } from 'react';
import { X, Square, Circle, Undo, Check, Move3D } from 'lucide-react';
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

interface MoveState {
  isMoving: boolean;
  regionIndex: number;
  offsetX: number;
  offsetY: number;
  originalX: number;
  originalY: number;
}

export function ImageEditor() {
  const { images, editingImageId, setEditingImage, setManualRegions } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<SelectionTool>('rect');
  const [regions, setRegions] = useState<Region[]>([]);
  const [moveActiveRegion, setMoveActiveRegion] = useState<number | null>(null);
  const [selection, setSelection] = useState<SelectionState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [moveState, setMoveState] = useState<MoveState>({
    isMoving: false,
    regionIndex: -1,
    offsetX: 0,
    offsetY: 0,
    originalX: 0,
    originalY: 0,
  });
  const [imageScale, setImageScale] = useState(1);

  const image = images.find(img => img.id === editingImageId);

  // Initialize with bottom-right corner selection on first load
  useEffect(() => {
    if (!image) return;

    // Only auto-select if no manual regions exist
    if (image.manualRegions.length === 0 && regions.length === 0) {
      // Create default selection for bottom-right corner (typical Gemini watermark location)
      const defaultRegion: Region = {
        x: image.dimensions.width * 0.75,
        y: image.dimensions.height * 0.75,
        width: image.dimensions.width * 0.2,
        height: image.dimensions.height * 0.2,
        type: 'manual-rect',
      };

      setRegions([defaultRegion]);
      logger.info('Auto-selected bottom-right corner for watermark');
    }
  }, [image]);

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
      const newScale = Math.min(scaleX, scaleY, 1);

      const scaledWidth = img.width * newScale;
      const scaledHeight = img.height * newScale;

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      setImageScale(newScale);

      drawCanvas(newScale);
    };

    function drawCanvas(scale: number) {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw existing regions (scaled to canvas)
      regions.forEach((region, index) => {
        const scaledRegion: Region = {
          x: region.x * scale,
          y: region.y * scale,
          width: region.width * scale,
          height: region.height * scale,
          type: region.type,
        };
        const isCurrentlyMoving = moveState.isMoving && index === moveState.regionIndex;
        drawRegion(ctx, scaledRegion, false, isCurrentlyMoving, index);
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

    if (imageScale > 0) {
      drawCanvas(imageScale);
    }
  }, [image, regions, selection, tool, moveState, imageScale, moveActiveRegion]);

  const drawRegion = (ctx: CanvasRenderingContext2D, region: Region, isActive = false, isMoving = false, regionIndex?: number) => {
    ctx.save();

    // Set style based on mode
    if (isMoving) {
      ctx.strokeStyle = '#10b981';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    } else if (moveActiveRegion === regionIndex) {
      ctx.strokeStyle = '#6366f1';
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    } else {
      ctx.strokeStyle = isActive ? '#3b82f6' : '#ef4444';
      ctx.fillStyle = isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    }

    ctx.lineWidth = 2;

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

    // Draw move toggle button (on the left side)
    const moveButtonSize = 20;
    const moveX = region.x - moveButtonSize/2 - 8; // Outside the region on the left
    const moveY = region.y + region.height / 2; // Center vertically

    // Move button background (circle)
    ctx.beginPath();
    ctx.arc(moveX, moveY, moveButtonSize/2, 0, 2 * Math.PI);
    ctx.fillStyle = moveActiveRegion === regionIndex ? '#6366f1' : '#94a3b8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw move icon (arrows)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw a simple move icon (4 arrows)
    const arrowSize = 4;
    ctx.beginPath();
    // Up arrow
    ctx.moveTo(moveX, moveY - arrowSize);
    ctx.lineTo(moveX - 2, moveY - arrowSize + 2);
    ctx.moveTo(moveX, moveY - arrowSize);
    ctx.lineTo(moveX + 2, moveY - arrowSize + 2);
    // Down arrow
    ctx.moveTo(moveX, moveY + arrowSize);
    ctx.lineTo(moveX - 2, moveY + arrowSize - 2);
    ctx.moveTo(moveX, moveY + arrowSize);
    ctx.lineTo(moveX + 2, moveY + arrowSize - 2);
    // Left arrow
    ctx.moveTo(moveX - arrowSize, moveY);
    ctx.lineTo(moveX - arrowSize + 2, moveY - 2);
    ctx.moveTo(moveX - arrowSize, moveY);
    ctx.lineTo(moveX - arrowSize + 2, moveY + 2);
    // Right arrow
    ctx.moveTo(moveX + arrowSize, moveY);
    ctx.lineTo(moveX + arrowSize - 2, moveY - 2);
    ctx.moveTo(moveX + arrowSize, moveY);
    ctx.lineTo(moveX + arrowSize - 2, moveY + 2);
    ctx.stroke();

    // Draw delete button (small X outside top-right corner)
    const deleteButtonSize = 16;
    const deleteX = region.x + region.width + 8; // Outside the region
    const deleteY = region.y - 8; // Slightly above top edge

    // Delete button background (square with rounded corners)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(deleteX - deleteButtonSize/2, deleteY - deleteButtonSize/2, deleteButtonSize, deleteButtonSize);

    // Add subtle border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(deleteX - deleteButtonSize/2, deleteY - deleteButtonSize/2, deleteButtonSize, deleteButtonSize);

    // Draw X icon (smaller and cleaner)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    const iconOffset = 4;
    ctx.beginPath();
    ctx.moveTo(deleteX - iconOffset, deleteY - iconOffset);
    ctx.lineTo(deleteX + iconOffset, deleteY + iconOffset);
    ctx.moveTo(deleteX + iconOffset, deleteY - iconOffset);
    ctx.lineTo(deleteX - iconOffset, deleteY + iconOffset);
    ctx.stroke();

    ctx.restore();
  };

  // Check if point is inside region (scaled coordinates)
  const isPointInRegion = (x: number, y: number, region: Region): boolean => {
    if (region.type === 'manual-circle') {
      const centerX = region.x + region.width / 2;
      const centerY = region.y + region.height / 2;
      const radiusX = region.width / 2;
      const radiusY = region.height / 2;

      // Ellipse equation
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      return dx * dx + dy * dy <= 1;
    } else {
      return x >= region.x && x <= region.x + region.width &&
             y >= region.y && y <= region.y + region.height;
    }
  };

  // Check if point is on delete button
  const isPointOnDeleteButton = (x: number, y: number, region: Region): boolean => {
    const deleteButtonSize = 16;
    const deleteX = region.x + region.width + 8; // Outside the region
    const deleteY = region.y - 8; // Slightly above top edge

    // Check if point is within the square button
    return x >= deleteX - deleteButtonSize/2 &&
           x <= deleteX + deleteButtonSize/2 &&
           y >= deleteY - deleteButtonSize/2 &&
           y <= deleteY + deleteButtonSize/2;
  };

  // Check if point is on move toggle button
  const isPointOnMoveButton = (x: number, y: number, region: Region): boolean => {
    const moveButtonSize = 20;
    const moveX = region.x - moveButtonSize/2 - 8; // Outside the region on the left
    const moveY = region.y + region.height / 2; // Center vertically

    // Check if point is within the circular button
    const dx = x - moveX;
    const dy = y - moveY;
    return Math.sqrt(dx * dx + dy * dy) <= moveButtonSize/2;
  };

  // Get coordinates from mouse or touch event
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // Handle both mouse and touch events
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on touch devices

    const coords = getCoordinates(e);

    // Check if clicking on delete button first (for any mode)
    const scaledRegions = regions.map(region => ({
      ...region,
      x: region.x * imageScale,
      y: region.y * imageScale,
      width: region.width * imageScale,
      height: region.height * imageScale,
    }));

    // Check move buttons first (from top to bottom)
    for (let i = scaledRegions.length - 1; i >= 0; i--) {
      if (isPointOnMoveButton(coords.x, coords.y, scaledRegions[i])) {
        // Toggle move mode for this region
        setMoveActiveRegion(moveActiveRegion === i ? null : i);
        logger.info(`Toggled move mode for region ${i}`);
        return;
      }
    }

    // Check delete buttons (from top to bottom)
    for (let i = scaledRegions.length - 1; i >= 0; i--) {
      if (isPointOnDeleteButton(coords.x, coords.y, scaledRegions[i])) {
        // Delete this region
        setRegions(prev => prev.filter((_, index) => index !== i));
        // Clear move mode if this region had it active
        if (moveActiveRegion === i) {
          setMoveActiveRegion(null);
        }
        logger.info(`Deleted region ${i}`);
        return;
      }
    }

    // Check if move mode is active and clicking on a region to move it
    if (moveActiveRegion !== null) {
      const regionIndex = moveActiveRegion;
      if (isPointInRegion(coords.x, coords.y, scaledRegions[regionIndex])) {
        // Start moving this region
        const region = regions[regionIndex];
        setMoveState({
          isMoving: true,
          regionIndex: regionIndex,
          offsetX: coords.x - (region.x * imageScale),
          offsetY: coords.y - (region.y * imageScale),
          originalX: region.x,
          originalY: region.y,
        });
        logger.info(`Started moving region ${regionIndex}`);
        return;
      }
    }

    // Drawing mode
    setSelection({
      isDrawing: true,
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
    });
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on touch devices

    const coords = getCoordinates(e);

    if (moveState.isMoving) {
      // Update region position
      const newX = (coords.x - moveState.offsetX) / imageScale;
      const newY = (coords.y - moveState.offsetY) / imageScale;

      setRegions(prev => prev.map((region, index) => {
        if (index === moveState.regionIndex) {
          return {
            ...region,
            x: newX,
            y: newY,
          };
        }
        return region;
      }));
    } else if (selection.isDrawing) {
      // Update selection while drawing
      setSelection(prev => ({
        ...prev,
        currentX: coords.x,
        currentY: coords.y,
      }));
    } else {
      // Drawing mode - check if hovering over buttons
      const scaledRegions = regions.map(region => ({
        ...region,
        x: region.x * imageScale,
        y: region.y * imageScale,
        width: region.width * imageScale,
        height: region.height * imageScale,
      }));

      // Check if hovering over any button
      let cursorStyle = 'crosshair';
      for (const region of scaledRegions) {
        if (isPointOnDeleteButton(coords.x, coords.y, region) ||
            isPointOnMoveButton(coords.x, coords.y, region)) {
          cursorStyle = 'pointer';
          break;
        }
        // Check if hovering over a region with move mode active
        if (moveActiveRegion !== null && isPointInRegion(coords.x, coords.y, region)) {
          cursorStyle = 'move';
          break;
        }
      }

      if (canvasRef.current) {
        canvasRef.current.style.cursor = cursorStyle;
      }
    }
  };

  const handleEnd = () => {
    if (moveState.isMoving) {
      logger.info(`Finished moving region ${moveState.regionIndex}`);
      setMoveState({
        isMoving: false,
        regionIndex: -1,
        offsetX: 0,
        offsetY: 0,
        originalX: 0,
        originalY: 0,
      });
    } else if (selection.isDrawing) {
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
    }
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
        <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-border bg-secondary/30">
          <div className="flex gap-2">
            <Button
              variant={tool === 'rect' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rect')}
              className="flex-1 sm:flex-initial"
            >
              <Square className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Rectangle</span>
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
              className="flex-1 sm:flex-initial"
            >
              <Circle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Circle</span>
            </Button>
          </div>

          <div className="flex gap-2 justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={regions.length === 0}
              className="flex-1 sm:flex-initial"
            >
              <Undo className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={regions.length === 0}
              className="flex-1 sm:flex-initial"
            >
              <Check className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Apply ({regions.length})</span>
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-secondary/10">
          <div className="flex justify-center items-center min-h-full">
            <canvas
              ref={canvasRef}
              // Mouse events
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              // Touch events
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              onTouchCancel={handleEnd}
              // Styles
              className="border border-border rounded shadow-lg touch-none max-w-full cursor-crosshair"
              style={{ touchAction: 'none' }} // Prevent default touch actions
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground">
            <strong>Instructions:</strong> Touch and drag to select watermarked regions.
            Click the move button (←→) on the left of a region to activate move mode, then drag to reposition.
            Click the red X button to delete a region.
            For Gemini watermarks, typically found in the bottom-right corner.
            Use circle tool for rounded watermarks, rectangle for text watermarks.
          </p>
        </div>
      </div>
    </div>
  );
}
