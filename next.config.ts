import type { NextConfig } from 'next';

// Local dev: proxy /api to the Express server so the browser sees one origin (on Vercel, vercel.json routes /api).
const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://localhost:4100').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
