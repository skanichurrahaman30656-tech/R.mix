"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LightboxProps {
  src: string;
  onClose: () => void;
  alt?: string;
}

export function Lightbox({ src, onClose, alt = "Enlarged view" }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Lock background scroll
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPosition({ x: 0, y: 0 }); // reset position if zoomed back to 1x
      }
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return; // Only allow pan when zoomed in
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Gestures (drag-to-pan & basic double tap zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1) return;
    if (e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.2, 5));
    } else {
      setScale(prev => {
        const next = Math.max(prev - 0.2, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Upper bar: Image info and close button */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-6 z-10 pointer-events-none">
        <span className="text-zinc-400 text-xs font-semibold tracking-wider pointer-events-auto">
          {scale > 1 ? `${Math.round(scale * 100)}% Zoomed` : 'Lightbox View'}
        </span>
        <button 
          onClick={onClose}
          className="p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors pointer-events-auto border border-zinc-800"
          title="Close (Esc)"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
      >
        <motion.div
          animate={{
            x: position.x,
            y: position.y,
            scale: scale
          }}
          transition={isDragging ? { type: 'just' } : { type: 'spring', damping: 25, stiffness: 220 }}
          className="relative max-w-[90%] max-h-[85%] cursor-grab active:cursor-grabbing flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className="pointer-events-none rounded max-w-full max-h-full object-contain"
          />
        </motion.div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-800 backdrop-blur px-4 py-2 rounded-full flex items-center gap-4 shadow-2xl z-10">
        <button 
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <button 
          onClick={handleReset}
          disabled={scale === 1 && position.x === 0 && position.y === 0}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <button 
          onClick={handleZoomIn}
          disabled={scale >= 5}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
