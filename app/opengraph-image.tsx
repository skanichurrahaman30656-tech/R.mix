import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'R.mix - Viral Growth & Social Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow backdrop */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 400,
            background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(99,102,241,0.15) 50%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            borderRadius: 9999,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#cbd5e1',
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          Next-Generation Social Media
        </div>

        {/* Brand Name */}
        <div
          style={{
            display: 'flex',
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(90deg, #ef4444 0%, #ec4899 50%, #6366f1 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 16,
          }}
        >
          R.mix
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Viral Reels, Interactive Video Feeds, Algorithmic Discovery & Copyright Protection
        </div>

        {/* Footer info */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: '#64748b',
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          <span>r-mix.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
