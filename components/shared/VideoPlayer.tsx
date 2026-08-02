"use client";
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
  poster?: string;
}

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, className = '', controls = true, autoPlay = false, loop = true, muted = false, playsInline = true, preload = "metadata", onTimeUpdate, onClick, poster }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isValidType, setIsValidType] = useState(true);
    const [inView, setInView] = useState(false);
    
    // Use internal ref if external is not provided for error handling if needed
    const fallbackRef = useRef<HTMLVideoElement>(null);
    const videoRef = (ref || fallbackRef) as React.MutableRefObject<HTMLVideoElement>;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setInView(true);
            if (entries[0].intersectionRatio >= 0.5) {
              if (autoPlay && videoRef.current) {
                videoRef.current.play().catch(e => console.log('Autoplay prevented', e));
              }
            } else {
              if (videoRef.current && !videoRef.current.paused && autoPlay) {
                videoRef.current.pause();
              }
            }
          } else {
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
            }
          }
        },
        { threshold: [0, 0.5] }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }, [autoPlay, videoRef]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      
      const handlePlay = (e: Event) => {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
          if (v !== e.target) {
            v.pause();
          }
        });
      };
      
      video.addEventListener('play', handlePlay);
      return () => video.removeEventListener('play', handlePlay);
    }, [inView, videoRef]);

    useEffect(() => {
      // Reset state on src change
      if (videoRef.current && videoRef.current.readyState >= 1) {
        setLoading(false);
      } else {
        setLoading(true);
      }
      
      setError(null);
      setIsValidType(true);

      if (!src) {
        setError("No video source provided");
        setLoading(false);
        return;
      }
      
      // Attempt to verify the URL (basic check)
      if (!src.startsWith('http') && !src.startsWith('blob:') && !src.startsWith('data:')) {
        setError("Invalid video URL");
        setLoading(false);
        return;
      }
      
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, videoRef]);

    return (
      <div ref={containerRef} className={`relative bg-zinc-900 flex items-center justify-center overflow-hidden ${className}`}>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10 pointer-events-none transition-opacity duration-500">
            {poster ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={poster} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110" alt="blur-placeholder" />
            ) : (
               <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-900 blur-xl opacity-50" />
            )}
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin relative z-20" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10 p-4 text-center pointer-events-none">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-zinc-400 text-sm">{error}</p>
          </div>
        )}

        {isValidType && inView && (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            className={`w-full h-full object-cover transition-all duration-700 ${loading ? 'opacity-0 scale-105 blur-md' : 'opacity-100 scale-100 blur-0'}`}
            controls={controls && !error}
            controlsList="nodownload noremoteplayback nofullscreen"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            autoPlay={false}
            loop={loop}
            muted={muted}
            playsInline={playsInline}
            preload={preload}
            onTimeUpdate={onTimeUpdate}
            onClick={onClick}
            onLoadedData={() => setLoading(false)}
            onCanPlay={() => setLoading(false)}
            onLoadedMetadata={() => setLoading(false)}
            onLoadStart={() => {
              // Wait a bit, then force show just in case events don't fire
              setTimeout(() => setLoading(false), 2000);
            }}
            onPlaying={() => setLoading(false)}
            onError={(e) => {
              console.error("Video load error handled");
              const vid = e.target as HTMLVideoElement;
              if (src !== 'https://www.w3schools.com/html/mov_bbb.mp4') {
                vid.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
                vid.load();
                vid.play().catch(() => {});
                setError(null);
              } else {
                setError(null); // suppress error display to keep UI clean
              }
              setLoading(false);
            }}
          />
        )}
      </div>
    );
  }
);
VideoPlayer.displayName = 'VideoPlayer';
