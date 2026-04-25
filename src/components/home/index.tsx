'use client';

import { useEffect, useMemo, useState } from 'react';

import { TabButton } from '@/commons/components/tab';
import { Header } from '@/commons/layout/header';
import type { ReferenceLocation } from '@/commons/types/runroute';
import { hasValidRouteStartCoordinate, reverseGeocodeRegion } from '@/commons/utils/geo';
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
  // [상태] 홈 화면 기본 상태 관리
  const [sheetVisibleHeight, setSheetVisibleHeight] = useState(260);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<DistanceCategory>>(new Set());
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [locationByCourseId, setLocationByCourseId] = useState<Record<string, string | null>>({});
  const [referenceLocation, setReferenceLocation] =
    useState<ReferenceLocation>(SEOUL_CITY_HALL_REFERENCE);
  const { routes, isLoading, errorMessage } = useRoutes();

  // [파생데이터] 필터/정렬 결과 계산
  const filteredRoutes = useMemo(
    () => filterRoutesByCategories(routes, selectedCategories),
    [routes, selectedCategories],
  );
  const courseCards = useMemo(
    () =>
      buildCourseCardViews(filteredRoutes, referenceLocation, selectedCourseId, locationByCourseId),
    [filteredRoutes, locationByCourseId, referenceLocation, selectedCourseId],
  );

  // [조회] 코스 시작 좌표를 시/도 + 구/군 주소로 변환
  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_TMAP_API_KEY?.trim() ?? '';
    if (!appKey) {
      return;
    }

    const unresolvedRoutes = routes.filter(
      (route) =>
        hasValidRouteStartCoordinate(route) && typeof locationByCourseId[route.id] === 'undefined',
    );

    if (unresolvedRoutes.length === 0) {
      return;
    }

    const abortController = new AbortController();
    let isCancelled = false;

    const loadLocations = async () => {
      const entries = await Promise.all(
        unresolvedRoutes.map(async (route) => {
          const address = await reverseGeocodeRegion({
            lat: route.start_lat,
            lng: route.start_lng,
            appKey,
            signal: abortController.signal,
          });

          return [route.id, address] as const;
        }),
      );

      if (isCancelled) {
        return;
      }

      setLocationByCourseId((previous) => {
        const next = { ...previous };
        entries.forEach(([courseId, address]) => {
          next[courseId] = address;
        });
        return next;
      });
    };

    loadLocations().catch((error) => {
      if (isCancelled || error instanceof DOMException) {
        return;
      }
      console.error('리버스지오코딩 실패:', error);
    });

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [locationByCourseId, routes]);

  // [초기화] 사용자 위치 기반 기준 좌표 설정
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

  // [동기화] 필터 결과와 선택 코스 정합성 유지
  useEffect(() => {
    if (!selectedCourseId) return;
    if (filteredRoutes.some((route) => route.id === selectedCourseId)) return;
    setSelectedCourseId(null);
  }, [filteredRoutes, selectedCourseId]);

  // [이벤트] 거리 카테고리 선택 토글 처리
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
      {/* [UI] 상단 헤더 영역 */}
      <div className={styles.topChrome}>
        <Header showLogo showLeftIcon={false} showRightIcon={false} title="RouteRun" />
      </div>
      {/* [UI] 거리 카테고리 탭 영역 */}
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

      {/* [UI] 조회 실패 메시지 영역 */}
      {errorMessage ? (
        <p role="status" className={styles.errorMessage}>
          {errorMessage}
        </p>
      ) : null}

      {/* [UI] 지도/코스 목록 연동 영역 */}
      <div className={styles.mapStage}>
        <div className={styles.map}>
          <TmapHome
            bottomSheetVisibleHeight={sheetVisibleHeight}
            isBottomSheetExpanded={isSheetExpanded}
            routes={filteredRoutes}
            selectedCourseId={selectedCourseId}
            onCourseMarkerClick={setSelectedCourseId}
          />
        </div>
        <CoursesList
          cards={courseCards}
          isLoading={isLoading}
          onCourseSelect={setSelectedCourseId}
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
