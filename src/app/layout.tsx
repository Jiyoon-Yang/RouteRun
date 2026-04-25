import { Layout } from '@/commons/layout';
import { AuthProvider } from '@/commons/providers/auth/auth.provider';
import { ModalProvider } from '@/commons/providers/modal/modal.provider';

import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'RunRoute',
  description: '전국의 러닝 코스를 찾고, 나만의 경로를 기록하여 러너들과 공유해보세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* TMap jsv2는 내부적으로 document.write()로 서브스크립트를 로드하므로
            next/script나 동적 주입이 불가능하고 동기 <script> 태그가 필수입니다. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src={`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_API_KEY}`}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ModalProvider>
            <Layout>{children}</Layout>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
