import React, { useState, useRef, useEffect } from 'react';
import { FiMove } from 'react-icons/fi';

interface ImageSliderProps {
  original: string;
  processed: string;
  originalLabel?: string;
  processedLabel?: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  original,
  processed,
  originalLabel = "Original",
  processedLabel = "Enhanced"
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage (0 - 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = (x / rect.width) * 100;
    
    // Contain boundaries
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-xl bg-space-900 select-none cursor-ew-resize"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Background: Original Image */}
      <img 
        src={original} 
        alt="Original Satellite IR" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-xs font-semibold text-slate-300 border border-white/5 pointer-events-none">
        {originalLabel}
      </div>

      {/* Foreground: Enhanced/Colorized Image (Clipped) */}
      <img 
        src={processed} 
        alt="Processed Satellite IR" 
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute bottom-4 right-4 bg-accent-purple/80 backdrop-blur-md px-3 py-1 rounded text-xs font-semibold text-white border border-accent-purple/20 pointer-events-none">
        {processedLabel}
      </div>

      {/* Divider Bar */}
      <div 
        style={{ left: `${sliderPosition}%` }}
        className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none flex items-center justify-center"
      >
        {/* Handle Button */}
        <div className="w-10 h-10 rounded-full bg-white text-space-900 shadow-xl border border-slate-200 flex items-center justify-center transform -translate-x-1/2 pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-all">
          <FiMove className="w-5 h-5 rotate-90" />
        </div>
      </div>
    </div>
  );
};
export default ImageSlider;
