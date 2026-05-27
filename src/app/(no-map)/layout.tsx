import { AppBody } from '@/commons/layout/app-body';
import { dynamic, generateMetadata, viewport } from '@/commons/layout/shared-metadata';

import '../globals.css';

export { dynamic, generateMetadata, viewport };

export default function NoMapRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <AppBody>{children}</AppBody>
    </html>
  );
}
