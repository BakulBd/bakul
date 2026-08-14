import type { NextConfig } from 'next';

/**
 * Headers kept deliberately conservative. A full Content-Security-Policy is
 * not set here: this page compiles WebGL shaders at runtime, loads Google
 * Fonts, and runs Web Audio — getting a CSP wrong for that mix fails silent
 * and partial (a shader refuses to link, a font never arrives) rather than
 * loud, and diagnosing that blind is worse than shipping without one. These
 * headers are the ones safe to set without dedicated CSP testing.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // This page uses none of these — explicitly say so rather than leaving
  // the default (permissive) policy in place.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  // Tree-shakes named imports from these packages down to what's actually
  // used, instead of pulling each package's full module graph into the trace.
  experimental: {
    optimizePackageImports: ['lucide-react', 'three', '@react-three/fiber'],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
