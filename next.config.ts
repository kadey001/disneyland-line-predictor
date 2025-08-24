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
    QUEUE_TIMES_API_URL: process.env.QUEUE_TIMES_API_URL,
  },
  images: {
    unoptimized: true, // Try this if you're having optimization issues
  },
};

export default nextConfig;
