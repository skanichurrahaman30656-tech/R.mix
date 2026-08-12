"use client";
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { trackView } from '@/lib/analytics';

export function ViewTracker({ type, id }: { type: string, id: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackView(supabase, type, id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [type, id]);

  return <div ref={ref} className="w-px h-px absolute top-1/2 left-1/2 pointer-events-none opacity-0" />;
}
