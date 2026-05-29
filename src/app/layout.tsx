import { dynamic, generateMetadata, viewport } from '@/commons/layout/metadata';
import { Providers } from '@/commons/layout/providers';

import './globals.css';

export { dynamic, generateMetadata, viewport };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <Providers>{children}</Providers>
    </html>
  );
}
