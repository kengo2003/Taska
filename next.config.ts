import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.AWS_BUCKET_NAME + '.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
