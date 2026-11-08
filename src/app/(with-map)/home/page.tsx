import { Suspense } from 'react';

import HomeWireframe from '@/components/home/';

import type { Metadata } from 'next';

// `/`와 같은 홈 화면이므로 검색엔진에는 `/`를 대표 URL로 알린다.
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeWireframe />
    </Suspense>
  );
}
