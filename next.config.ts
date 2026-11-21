import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  rewrites() {
    return Promise.resolve([
      {
        source: '/api/auth/paus/callback',
        destination: '/api/auth/callback/paus',
      },
    ]);
  },
};

export default nextConfig;
