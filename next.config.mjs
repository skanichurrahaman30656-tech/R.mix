/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
