import { Layout } from '@/commons/layout';
import { AuthProvider } from '@/commons/providers/auth/auth.provider';
import { ModalProvider } from '@/commons/providers/modal/modal.provider';
import { ToastProvider } from '@/commons/providers/toast/toast.provider';
import { createClient } from '@/lib/supabase/server';
import { getUserRouteWriteCount } from '@/services/course/courseService';
import { getUserTrackWriteCount } from '@/services/track/trackService';

import type { Metadata, Viewport } from 'next';

import './globals.css';

export const dynamic = 'force-dynamic';

// 아이콘 에셋은 public/assets/logo/ 에서 중앙 관리하며 metadata.icons로 명시한다.
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let hasWrittenItem = false;

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError && userError.message !== 'Auth session missing!') {
      console.error('[RootLayout] getUser 실패:', userError.message);
    }

    if (user?.is_anonymous === true) {
      const [courseResult, trackResult] = await Promise.all([
        getUserRouteWriteCount(user.id),
        getUserTrackWriteCount(user.id),
      ]);

      if (courseResult.error) {
        console.error('[RootLayout] 게스트 코스 작성 횟수 조회 실패:', courseResult.error.message);
      }
      if (trackResult.error) {
        console.error('[RootLayout] 게스트 트랙 작성 횟수 조회 실패:', trackResult.error.message);
      }

      const courseCount = courseResult.count ?? 0;
      const trackCount = trackResult.count ?? 0;
      hasWrittenItem = courseCount + trackCount >= 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[RootLayout] 세션·작성 집계 초기화 중 오류:', message);
    hasWrittenItem = false;
  }

  return (
    <html lang="ko">
      <head>
        {/* TMap SDK가 내부적으로 document.write를 사용해 동기 로드가 필요하다. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          id="tmap-vector-sdk"
          src={`https://apis.openapi.sk.com/tmap/vectorjs?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_API_KEY}`}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ModalProvider>
            <ToastProvider>
              <Layout hasWrittenItem={hasWrittenItem}>{children}</Layout>
            </ToastProvider>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
