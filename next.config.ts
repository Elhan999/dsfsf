import type { NextConfig } from 'next';

// The API is proxied through this app so the browser sees one origin and the refresh cookie stays first-party.
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
