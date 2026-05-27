import { AppBody } from '@/commons/layout/app-body';
import { dynamic, generateMetadata, viewport } from '@/commons/layout/shared-metadata';

import '../globals.css';

export { dynamic, generateMetadata, viewport };

export default function MapRootLayout({ children }: { children: React.ReactNode }) {
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
      <AppBody>{children}</AppBody>
    </html>
  );
}
