import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Los paquetes del workspace se publican como TypeScript sin compilar.
  transpilePackages: ['@bodgo/core', '@bodgo/db'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default config;
