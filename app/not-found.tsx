import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-4xl font-bold mb-2">404</h2>
      <p className="text-zinc-400 mb-6">Page not found</p>
      <Link
        href="/"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
