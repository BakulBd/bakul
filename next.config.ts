import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
