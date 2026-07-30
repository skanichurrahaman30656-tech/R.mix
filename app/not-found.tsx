export const dynamic = 'force-dynamic';
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black font-serif mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-6">Page Not Found</h2>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <a 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
