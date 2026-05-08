import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Optimize for Cloud Run
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Environment variables that should be available at build time
  env: {
    WAIT_TIMES_API_URL: process.env.WAIT_TIMES_API_URL,
  },
  images: {
    remotePatterns: [new URL('https://kcr90ci7l2.ufs.sh/**')],
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
