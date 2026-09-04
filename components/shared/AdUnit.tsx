'use client';
import { useEffect, useRef } from 'react';

interface AdUnitProps {
  className?: string;
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string;
}

export default function AdUnit({ className, slotId, format = 'auto', layoutKey }: AdUnitProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense push error:', err);
    }
  }, []);

  return (
    <div className={`ad-container ${className || ''}`} style={{ width: '100%', overflow: 'hidden', textAlign: 'center', margin: '16px 0' }}>
      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8344189408835852"
        data-ad-slot={slotId || undefined}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-ad-layout-key={layoutKey || undefined}
      />
    </div>
  );
}
