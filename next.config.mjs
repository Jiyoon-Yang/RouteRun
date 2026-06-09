// next.config.mjs
/** @type {import('next').NextConfig} */

// CSP 참고:
// - script-src 'unsafe-inline': (with-map)/layout.tsx의 TMap 인라인 로더 스크립트에 필요
// - https://apis.openapi.sk.com: TMap SDK 및 API 호출
// - https://*.tmap.co.kr: TMap 벡터 타일 CDN
// - wss://*.supabase.co: Supabase Realtime 웹소켓
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.openapi.sk.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://apis.openapi.sk.com https://*.tmap.co.kr",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: CSP },
];

const nextConfig = {
  reactStrictMode: false, // true에서 false로 변경
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'apis.openapi.sk.com',
        pathname: '/**',
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      type: 'asset/resource',
    });
    return config;
  },
};

export default nextConfig;
