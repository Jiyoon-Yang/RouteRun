import { Suspense } from 'react';

import HomeWireframe from '@/components/home/';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeWireframe />
    </Suspense>
  );
}
