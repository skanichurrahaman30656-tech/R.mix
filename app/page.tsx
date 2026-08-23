import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const MainDashboardClient = nextDynamic(
  () => import('@/components/MainDashboardClient'),
  { ssr: false }
);

export default function Home() {
  headers();
  return (
    <>
      <main className="sr-only">
        <h1>R.mix – Premium Social Experience Platform</h1>
        <p>
          R.mix is a next-generation premium social platform designed for creators, builders, and vibrant communities. 
          Share stories, full-length video uploads, high-definition short clips/reels, post daily updates, or host live interactive broadcasts directly to your followers. 
          Experience real-time connections with high fidelity, personalized feed feeds, detailed analytics dashboards, and interactive chat messaging features.
        </p>
      </main>
      <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>}>
        <MainDashboardClient />
      </Suspense>
    </>
  );
}

