import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@despega/simulator', '@despega/data', '@despega/auth'],
  async headers() {
    const headers = [...securityHeaders];
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "connect-src 'self'",
          "font-src 'self' data:",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "img-src 'self' data:",
          "object-src 'none'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
        ].join('; '),
      });
    }
    return [{ source: '/(.*)', headers }];
  },
};

export default nextConfig;
