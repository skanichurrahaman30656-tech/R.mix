import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: string;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  onClick?: (e: React.MouseEvent<HTMLVideoElement, MouseEvent>) => void;
}

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, className = '', controls = true, autoPlay = false, loop = true, muted = false, playsInline = true, preload = "metadata", onTimeUpdate, onClick }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isValidType, setIsValidType] = useState(true);
    
    // Use internal ref if external is not provided for error handling if needed
    const fallbackRef = useRef<HTMLVideoElement>(null);
    const videoRef = (ref || fallbackRef) as React.MutableRefObject<HTMLVideoElement>;

    useEffect(() => {
      // Reset state on src change
      setLoading(true);
      setError(null);
      setIsValidType(true);

      if (!src) {
        setError("No video source provided");
        setLoading(false);
        return;
      }

      // Attempt to verify the URL (basic check)
      if (!src.startsWith('http') && !src.startsWith('blob:')) {
        setError("Invalid video URL");
        setLoading(false);
        return;
      }
      
    }, [src]);

    return (
      <div className={`relative bg-zinc-900 flex items-center justify-center overflow-hidden ${className}`}>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10 pointer-events-none">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10 p-4 text-center pointer-events-none">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-zinc-400 text-sm">{error}</p>
          </div>
        )}

        {isValidType && (
          <video
            ref={videoRef}
            src={src}
            className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
            controls={controls && !error}
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            playsInline={playsInline}
            preload={preload}
            onTimeUpdate={onTimeUpdate}
            onClick={onClick}
            onLoadedData={() => setLoading(false)}
            onPlaying={() => setLoading(false)}
            onError={(e) => {
              console.error("Video load error", e);
              setError("Failed to load video.");
              setLoading(false);
            }}
          />
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
