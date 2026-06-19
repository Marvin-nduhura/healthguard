import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // PWA cache headers
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ];
  },

  // Server-only packages — must not be bundled for the browser
  serverExternalPackages: ['@prisma/adapter-pg', 'pg', '@prisma/client'],

  // Pin workspace root to this directory (silences multi-root warning)
  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.onrender.com' },
    ],
  },
};

export default nextConfig;
