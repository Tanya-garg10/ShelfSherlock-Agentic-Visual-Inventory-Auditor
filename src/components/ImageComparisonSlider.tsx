import React, { useState, useRef, useCallback } from 'react';

interface ImageComparisonSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = 'REFERENCE PLANOGRAM',
  afterLabel = 'CURRENT CAPTURE',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Image comparison before and after position"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onClick={(e) => handleMove(e.clientX)}
      className={`relative select-none overflow-hidden rounded-sm border border-[#E5E3DC] bg-[#EFECE6] cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-[#3158C9] ${className}`}
      style={{ aspectRatio: '3/2' }}
    >
      {/* After Image (Background - Current) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        referrerPolicy="no-referrer"
      />

      {/* Before Image (Foreground Clipped - Reference) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-contain max-w-none"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Hairline Divider & Handle */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-0 bottom-0 -ml-[1px] w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.35)]" />
        <div className="absolute top-1/2 -mt-4 -ml-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E3DC] bg-white text-[#20211F] shadow-md">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
          </svg>
        </div>
      </div>

      {/* Badges / Labels */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="bg-[#20211F]/85 text-[#F8F7F3] text-[10px] tracking-wider font-mono uppercase px-2 py-1">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute top-3 right-3 pointer-events-none">
        <span className="bg-[#20211F]/85 text-[#F8F7F3] text-[10px] tracking-wider font-mono uppercase px-2 py-1">
          {afterLabel}
        </span>
      </div>
    </div>
  );
};
