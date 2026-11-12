// next.config.mjs
/** @type {import('next').NextConfig} */

// CSP 참고:
// - script-src 'unsafe-inline': (with-map)/layout.tsx의 TMap 인라인 로더 스크립트에 필요
// - https://apis.openapi.sk.com: TMap SDK 및 API 호출
// - https://*.tmap.co.kr: TMap 벡터 타일 CDN
// - wss://*.supabase.co: Supabase Realtime 웹소켓
// - *.googletagmanager.com, *.google-analytics.com, *.analytics.google.com: GA4 (app/layout.tsx)
// - 'unsafe-eval': 개발 환경에서만 허용 (Next.js Fast Refresh가 eval() 사용)
const isDev = process.env.NODE_ENV === 'development';
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://apis.openapi.sk.com https://*.tmap.co.kr https://*.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline' https://*.tmap.co.kr",
  "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://*.tmap.co.kr https://*.google-analytics.com https://*.googletagmanager.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://apis.openapi.sk.com https://*.tmap.co.kr https://*.tmapmp.com https://*.onestore.co.kr https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  "worker-src 'self' blob: https://*.tmap.co.kr",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Content-Security-Policy', value: CSP },
];

const nextConfig = {
  reactStrictMode: false, // true에서 false로 변경
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      // *.supabase.co로 열어 두면 다른 프로젝트 이미지도 우리 next/image 최적화로 변환되니 이 프로젝트 호스트만 연다.
      // env가 없는 빌드(Storybook·CI 등)는 이 패턴만 빼고 빌드를 이어 간다.
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [
            {
              protocol: 'https',
              hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
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
