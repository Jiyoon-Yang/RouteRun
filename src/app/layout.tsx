import { Layout } from '@/commons/layout';
import { AuthProvider } from '@/commons/providers/auth/auth.provider';
import { ModalProvider } from '@/commons/providers/modal/modal.provider';

import type { Metadata } from 'next';
import Script from 'next/script';

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
      <head />
      <body className="antialiased">
        <Script
          id="tmap-vector-sdk"
          strategy="afterInteractive"
          src={`https://apis.openapi.sk.com/tmap/vectorjs?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_API_KEY}`}
        />
        <AuthProvider>
          <ModalProvider>
            <Layout>{children}</Layout>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
