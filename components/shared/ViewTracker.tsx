"use client";
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { trackView } from '@/lib/analytics';

export function ViewTracker({ type, id, userId }: { type: string, id: string, userId?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          timer = setTimeout(() => {
            trackView(supabase, type, id, userId);
            observer.disconnect();
          }, 2000);
        } else {
          if (timer) clearTimeout(timer);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [type, id, userId]);

  return <div ref={ref} className="w-px h-px absolute top-1/2 left-1/2 pointer-events-none opacity-0" />;
}
