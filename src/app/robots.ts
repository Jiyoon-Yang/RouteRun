import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 로그인 필요 화면은 미들웨어가 /login으로 리다이렉트하므로 수집에서 뺀다 (PRIVATE_ROUTES와 맞춘다)
      disallow: [
        '/mypage',
        '/report',
        '/login',
        '/auth/',
        '/courses/new',
        '/tracks/new',
        '/courses/*/edit',
        '/tracks/*/edit',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
