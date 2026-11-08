import Script from 'next/script';

import { dynamic, generateMetadata, viewport } from '@/commons/layout/metadata';
import { Providers } from '@/commons/layout/providers';

import './globals.css';

export { dynamic, generateMetadata, viewport };

// 서버 컴포넌트에서만 읽으므로 NEXT_PUBLIC_ 접두어가 필요 없다. Vercel Production에만 설정해 로컬·Preview 방문은 집계하지 않는다.
const GA_ID = process.env.GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <Providers>
        {children}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </Providers>
    </html>
  );
}
