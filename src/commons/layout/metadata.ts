import type { Metadata, Viewport } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    metadataBase: new URL(baseUrl),
    title: '루트런 | 내 주변 러닝 코스',
    description: '전국의 러닝 코스를 찾고, 나만의 경로를 기록하여 러너들과 공유해보세요.',
    applicationName: '루트런',
    openGraph: {
      title: '루트런 | 내 주변 러닝 코스',
      description: '전국의 러닝 코스를 찾고, 나만의 경로를 기록하여 러너들과 공유해보세요.',
      siteName: '루트런',
      locale: 'ko_KR',
      type: 'website',
      images: [{ url: `${baseUrl}/assets/logo/rr-logo.png`, alt: '루트런 로고' }],
    },
    icons: {
      icon: [
        { url: '/assets/logo/favicon.ico' },
        { url: '/assets/logo/logo.svg', type: 'image/svg+xml' },
        { url: '/assets/logo/favicon/favicon16.png', sizes: '16x16', type: 'image/png' },
        { url: '/assets/logo/favicon/favicon32.png', sizes: '32x32', type: 'image/png' },
        { url: '/assets/logo/favicon/favicon48.png', sizes: '48x48', type: 'image/png' },
        { url: '/assets/logo/favicon/favicon64.png', sizes: '64x64', type: 'image/png' },
      ],
      shortcut: [{ url: '/assets/logo/favicon.ico' }],
      apple: [{ url: '/assets/logo/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    appleWebApp: {
      title: '루트런',
      statusBarStyle: 'default',
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};
