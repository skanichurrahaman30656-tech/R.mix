import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const SignupPageClient = nextDynamic(() => import('./SignupPageClient'), { ssr: false });

export default function SignupPage() {
  headers();
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>}>
      <SignupPageClient />
    </Suspense>
  );
}
