'use client';

import { useState } from 'react';

import { TabButton } from '@/commons/components/tab';
import { Header } from '@/commons/layout/header';
import { CoursesList } from '@/components/courses-list';
import { TmapHome } from '@/components/tmap/home';

import styles from './styles.module.css';

const TAB_ITEMS = [
  { label: '~3km', variant: 'blue' as const, isActive: false },
  { label: '3~5km', variant: 'green' as const, isActive: false },
  { label: '5~10km', variant: 'red' as const, isActive: false },
  { label: '10km~', variant: 'orange' as const, isActive: false },
];

export function Home() {
  const [sheetVisibleHeight, setSheetVisibleHeight] = useState(24);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  return (
    <section className={styles.container}>
      <div className={styles.topChrome}>
        <Header showLogo showLeftIcon={false} showRightIcon={false} title="RouteRun" />
      </div>
      <div className={styles.tab}>
        <div className={styles.tabScroll}>
          {TAB_ITEMS.map((tab) => (
            <div key={tab.label} className={styles.tabItem}>
              <TabButton variant={tab.variant} isActive={tab.isActive}>
                {tab.label}
              </TabButton>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mapStage}>
        <div className={styles.map}>
          <TmapHome
            bottomSheetVisibleHeight={sheetVisibleHeight}
            isBottomSheetExpanded={isSheetExpanded}
          />
        </div>
        <CoursesList
          onSheetPositionChange={({ state, visibleHeight }) => {
            setIsSheetExpanded(state === 'expanded');
            setSheetVisibleHeight(visibleHeight);
          }}
        />
      </div>
    </section>
  );
}

export default Home;
