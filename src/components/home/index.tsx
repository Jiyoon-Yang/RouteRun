'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TabButton } from '@/commons/components/tab';
import { ROUTES } from '@/commons/constants/url';
import { Header } from '@/commons/layout/header';
import type { ReferenceLocation, RouteViewport } from '@/commons/types/runroute';
import { CoursesList } from '@/components/courses-list';
import { TmapHome } from '@/components/tmap/home';
import { useCourseLikes } from '@/hooks/useCourseLikes';

import { useRoutes } from './hooks/index.use-routes';
import styles from './styles.module.css';
import {
  buildCourseCardViews,
  dedupeRoutesById,
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
  const [openPeekFromCollapsedSignal, setOpenPeekFromCollapsedSignal] = useState(0);
  const [markerClickRecenterToken, setMarkerClickRecenterToken] = useState(0);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<DistanceCategory>>(new Set());
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [mapViewport, setMapViewport] = useState<RouteViewport | null>(null);
  const [queryViewport, setQueryViewport] = useState<RouteViewport | null>(null);
  const [referenceLocation, setReferenceLocation] =
    useState<ReferenceLocation>(SEOUL_CITY_HALL_REFERENCE);
  const { routes, allRoutes, isLoading, errorMessage } = useRoutes(queryViewport);
  const router = useRouter();

  const isSameViewport = useCallback((left: RouteViewport | null, right: RouteViewport | null) => {
    if (!left || !right) return false;
    return (
      left.northEastLat === right.northEastLat &&
      left.northEastLng === right.northEastLng &&
      left.southWestLat === right.southWestLat &&
      left.southWestLng === right.southWestLng
    );
  }, []);

  const handleViewportChanged = useCallback(
    (nextViewport: RouteViewport) => {
      setMapViewport((previous) =>
        isSameViewport(previous, nextViewport) ? previous : nextViewport,
      );
      setQueryViewport((previous) => previous ?? { ...nextViewport });
    },
    [isSameViewport],
  );

  // 클라이언트 뷰포트 필터만 사용하므로 mapViewport와 즉시 동기화 (바텀시트·지도 이동 반응 지연 최소화)
  useEffect(() => {
    if (!mapViewport) return;
    setQueryViewport((previous) =>
      isSameViewport(previous, mapViewport) ? previous : { ...mapViewport },
    );
  }, [isSameViewport, mapViewport]);

  // [파생데이터] 필터/정렬 결과 계산 (선택된 코스는 뷰포트 밖이어도 목록·지도에 유지)
  const filteredRoutes = useMemo(() => {
    const base = filterRoutesByCategories(routes, selectedCategories);
    if (!selectedCourseId) {
      return base;
    }
    if (base.some((route) => route.id === selectedCourseId)) {
      return base;
    }
    const selected = allRoutes.find((route) => route.id === selectedCourseId);
    if (!selected) {
      return base;
    }
    return dedupeRoutesById([selected, ...base]);
  }, [routes, selectedCategories, selectedCourseId, allRoutes]);
  const courseCards = useMemo(
    () => buildCourseCardViews(filteredRoutes, referenceLocation, selectedCourseId),
    [filteredRoutes, referenceLocation, selectedCourseId],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      process.env.NODE_ENV !== 'development' &&
      window.localStorage?.getItem('DEBUG_HOME_VIEWPORT') !== '1'
    ) {
      return;
    }
    /* eslint-disable no-console -- DEBUG_HOME_VIEWPORT / 홈 지도-목록-마커 파이프라인 */
    console.log('[Home] queryViewport & 마커용 routes', {
      queryViewport,
      viewportFilteredRoutesCount: routes.length,
      filteredRoutesCount: filteredRoutes.length,
      markersOnMapCount: filteredRoutes.length,
    });
    /* eslint-enable no-console */
  }, [queryViewport, routes.length, filteredRoutes.length]);
  const courseLikeCounts = useMemo(
    () =>
      allRoutes.reduce<Record<string, number>>((acc, route) => {
        acc[route.id] = route.likes_count;
        return acc;
      }, {}),
    [allRoutes],
  );
  const { isCourseLiked, getCourseLikeCount, toggleCourseLike } = useCourseLikes(courseLikeCounts);

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

  const handleCourseMarkerClick = useCallback(
    (courseId: string) => {
      setSelectedCourseId(courseId);
      setMarkerClickRecenterToken((previous) => previous + 1);
      if (sheetVisibleHeight <= 24) {
        setOpenPeekFromCollapsedSignal((previous) => previous + 1);
      }
    },
    [sheetVisibleHeight],
  );

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
            markerClickRecenterToken={markerClickRecenterToken}
            onCourseMarkerClick={handleCourseMarkerClick}
            onViewportChanged={handleViewportChanged}
          />
        </div>
        <CoursesList
          cards={courseCards}
          isLoading={isLoading}
          isCourseLiked={isCourseLiked}
          getCourseLikeCount={getCourseLikeCount}
          openPeekFromCollapsedSignal={openPeekFromCollapsedSignal}
          onCourseSelect={(courseId) => {
            setSelectedCourseId(courseId);
            router.push(ROUTES.COURSES.DETAIL(courseId));
          }}
          onCourseLikeToggle={toggleCourseLike}
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
