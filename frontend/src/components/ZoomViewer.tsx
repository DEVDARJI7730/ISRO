import React, { useState, useRef, MouseEvent, TouchEvent } from 'react';
import { FiZoomIn, FiZoomOut, FiRefreshCw } from 'react-icons/fi';

interface ZoomViewerProps {
  src: string;
  alt: string;
}

export const ZoomViewer: React.FC<ZoomViewerProps> = ({ src, alt }) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startDrag, setStartDrag] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewerRef = useRef<HTMLDivElement>(null);

  // Zoom adjustments
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.75));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return; // Only pan when zoomed in
    e.preventDefault();
    setIsPanning(true);
    setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPosition({
      x: e.clientX - startDrag.x,
      y: e.clientY - startDrag.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  // Touch pan handlers
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    setIsPanning(true);
    setStartDrag({ 
      x: e.touches[0].clientX - position.x, 
      y: e.touches[0].clientY - position.y 
    });
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPosition({
      x: e.touches[0].clientX - startDrag.x,
      y: e.touches[0].clientY - startDrag.y
    });
  };

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-xl bg-space-900 select-none">
      {/* Zoom controls floating panel */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
        <button 
          onClick={zoomIn} 
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <FiZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={zoomOut}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <FiZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={resetZoom}
          title="Reset Zoom"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Render Canvas */}
      <div 
        ref={viewerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
        className={`w-full h-full flex items-center justify-center overflow-hidden ${
          scale > 1 ? 'cursor-move' : 'cursor-default'
        }`}
      >
        <img 
          src={src} 
          alt={alt}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isPanning ? 'none' : 'transform 0.15s ease-out'
          }}
          className="max-w-full max-h-full object-contain pointer-events-none"
        />
      </div>

      {/* Dynamic zoom factor indicator overlay */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-xs text-slate-300 pointer-events-none">
        Zoom: {Math.round(scale * 100)}%
      </div>
    </div>
  );
};
export default ZoomViewer;
