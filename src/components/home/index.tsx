'use client';

import { useEffect, useMemo, useState } from 'react';

import { TabButton } from '@/commons/components/tab';
import { Header } from '@/commons/layout/header';
import type { ReferenceLocation } from '@/commons/types/runroute';
import { CoursesList } from '@/components/courses-list';
import { TmapHome } from '@/components/tmap/home';

import { useRoutes } from './hooks/index.use-routes';
import styles from './styles.module.css';
import {
  buildCourseCardViews,
  filterRoutesByCategories,
  SEOUL_CITY_HALL_REFERENCE,
  type DistanceCategory,
} from './utils/course-filter';

const TAB_ITEMS = [
  { label: '~3km', variant: 'blue' as const, category: 'UNDER_3' as const },
  { label: '3~5km', variant: 'green' as const, category: 'BETWEEN_3_AND_5' as const },
  { label: '5~10km', variant: 'red' as const, category: 'BETWEEN_5_AND_10' as const },
  { label: '10km~', variant: 'orange' as const, category: 'OVER_10' as const },
];

export function Home() {
  const [sheetVisibleHeight, setSheetVisibleHeight] = useState(24);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<DistanceCategory>>(new Set());
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [referenceLocation, setReferenceLocation] =
    useState<ReferenceLocation>(SEOUL_CITY_HALL_REFERENCE);
  const { routes, isLoading, errorMessage } = useRoutes();

  const filteredRoutes = useMemo(
    () => filterRoutesByCategories(routes, selectedCategories),
    [routes, selectedCategories],
  );
  const courseCards = useMemo(
    () => buildCourseCardViews(filteredRoutes, referenceLocation, selectedCourseId),
    [filteredRoutes, referenceLocation, selectedCourseId],
  );

  useEffect(() => {
    let isCancelled = false;

    if (!navigator.geolocation) {
      setReferenceLocation(SEOUL_CITY_HALL_REFERENCE);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isCancelled) return;
        setReferenceLocation({
          type: 'CURRENT_USER_LOCATION',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        if (isCancelled) return;
        setReferenceLocation(SEOUL_CITY_HALL_REFERENCE);
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    if (filteredRoutes.some((route) => route.id === selectedCourseId)) return;
    setSelectedCourseId(null);
  }, [filteredRoutes, selectedCourseId]);

  const toggleCategory = (category: DistanceCategory) => {
    setSelectedCategories((previous) => {
      const next = new Set(previous);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <section className={styles.container}>
      <div className={styles.topChrome}>
        <Header showLogo showLeftIcon={false} showRightIcon={false} title="RouteRun" />
      </div>
      <div className={styles.tab}>
        <div className={styles.tabScroll}>
          {TAB_ITEMS.map((tab) => (
            <div key={tab.label} className={styles.tabItem}>
              <TabButton
                variant={tab.variant}
                isActive={selectedCategories.has(tab.category)}
                onClick={() => toggleCategory(tab.category)}
              >
                {tab.label}
              </TabButton>
            </div>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <p role="status" className={styles.errorMessage}>
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.mapStage}>
        <div className={styles.map}>
          <TmapHome
            bottomSheetVisibleHeight={sheetVisibleHeight}
            isBottomSheetExpanded={isSheetExpanded}
            routes={filteredRoutes}
            onCourseMarkerClick={setSelectedCourseId}
          />
        </div>
        <CoursesList
          cards={courseCards}
          isLoading={isLoading}
          onSheetPositionChange={({ state, visibleHeight }) => {
            setIsSheetExpanded(state === 'expanded');
            setSheetVisibleHeight(visibleHeight);
          }}
        />
      </div>
      {isLoading ? (
        <p role="status" className={styles.loadingMessage}>
          코스 정보를 불러오는 중...
        </p>
      ) : null}
    </section>
  );
}

export default Home;
