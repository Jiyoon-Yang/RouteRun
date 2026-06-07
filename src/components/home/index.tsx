'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Icon } from '@/commons/components/icons';
import { TabButton } from '@/commons/components/tab';
import { TAB_ITEMS } from '@/commons/constants/home';
import { useCourseLikes } from '@/commons/hooks/useCourseLikes';
import { useTrackLikes } from '@/commons/hooks/useTrackLikes';
import { Header } from '@/commons/layout/header';
import { Sidebar } from '@/commons/layout/sidebar';
import type { HomeListItem, Route, RouteViewport } from '@/commons/types/routerun';
import { calculateLinearDistanceMeters } from '@/commons/utils/geo';
import { CoursesList } from '@/components/courses-list';
import { TmapHome } from '@/components/tmap/home';

import { useRoutes } from './hooks/index.use-routes';
import { useClearSelectedRouteSnapshotOnDeselect } from './hooks/use-clear-selected-route-snapshot';
import { useHomeCourseMarkerClick } from './hooks/use-home-course-marker-click';
import { useHomeDistanceCategories } from './hooks/use-home-distance-categories';
import { useHomeFrozenViewportSync } from './hooks/use-home-frozen-viewport';
import { useHomeToast } from './hooks/use-home-toast';
import { useHomeStateSync } from './hooks/use-home-state-sync';
import { useHomeVisibleRouteViewport } from './hooks/use-home-visible-viewport';
import { useReferenceLocation } from './hooks/use-reference-location';
import { useTracks } from './hooks/use-tracks';
import { OnboardingModal } from './onboarding-modal';
import styles from './styles.module.css';
import { buildCourseCardViews } from './utils/course-filter';
import { buildCourseLikeCountsLookup } from './utils/home-like-counts';
import {
  computeFilteredRoutesForHome,
  computeRoutesForCourseListForHome,
} from './utils/home-route-derivations';

export function Home() {
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [sheetVisibleHeight, setSheetVisibleHeight] = useState(260);
  const [sheetVisualVisibleHeight, setSheetVisualVisibleHeight] = useState(260);
  const sheetVisibleHeightRef = useRef(sheetVisibleHeight);
  sheetVisibleHeightRef.current = sheetVisibleHeight;
  const [openPeekFromCollapsedSignal, setOpenPeekFromCollapsedSignal] = useState(0);
  const [markerClickRecenterToken, setMarkerClickRecenterToken] = useState(0);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const { selectedCategories, setSelectedCategories, toggleCategory } = useHomeDistanceCategories();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  /** 뷰포트 밖으로 이동해도 선택 코스를 목록·지도에 유지 (조회 결과 우선, 없을 때만 사용) */
  const [selectedRouteSnapshot, setSelectedRouteSnapshot] = useState<Route | null>(null);
  const [visibleRouteViewport, setVisibleRouteViewport] = useState<RouteViewport | null>(null);
  const [frozenVisibleRouteViewport, setFrozenVisibleRouteViewport] =
    useState<RouteViewport | null>(null);
  const [restoredInitialViewport, setRestoredInitialViewport] = useState<RouteViewport | null>(
    null,
  );
  const referenceLocation = useReferenceLocation();

  // 펼침 직후 frozen이 아직 없을 때(드래그 등) null로 코스가 비지 않도록 visible로 이어 붙임
  const effectiveQueryViewport = isSheetExpanded
    ? (frozenVisibleRouteViewport ?? visibleRouteViewport)
    : visibleRouteViewport;
  const { routes, allRoutes, isLoading, errorMessage } = useRoutes(effectiveQueryViewport);
  const { tracks } = useTracks(effectiveQueryViewport);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { homeToast, isHomeToastFadingOut, handleZoomLimitReached, handleZoomLimitCleared } =
    useHomeToast({
      queryViewport: effectiveQueryViewport,
      routesLength: routes.length,
      isLoading,
      errorMessage,
    });

  const handleVisibleRouteViewportChanged = useHomeVisibleRouteViewport(setVisibleRouteViewport);

  useHomeFrozenViewportSync({
    isSheetExpanded,
    visibleRouteViewport,
    setFrozenVisibleRouteViewport,
  });

  useClearSelectedRouteSnapshotOnDeselect(selectedCourseId, setSelectedRouteSnapshot);

  const { snapshotBeforeDetail } = useHomeStateSync({
    searchParams,
    pathname: pathname ?? '',
    router,
    selectedCategories,
    isSheetExpanded,
    setSelectedCourseId,
    setSelectedTrackId,
    setSelectedCategories,
    setIsSheetExpanded,
    setVisibleRouteViewport,
    setFrozenVisibleRouteViewport,
    setRestoredInitialViewport,
    setMarkerClickRecenterToken,
    visibleRouteViewport,
    effectiveQueryViewport,
    frozenVisibleRouteViewport,
  });

  const filteredRoutes = useMemo(
    () =>
      computeFilteredRoutesForHome(
        routes,
        selectedCategories,
        selectedCourseId,
        allRoutes,
        selectedRouteSnapshot,
      ),
    [allRoutes, routes, selectedCategories, selectedCourseId, selectedRouteSnapshot],
  );

  const routesForCourseList = useMemo(
    () =>
      computeRoutesForCourseListForHome(
        filteredRoutes,
        effectiveQueryViewport,
        selectedCourseId,
        allRoutes,
        selectedRouteSnapshot,
      ),
    [allRoutes, effectiveQueryViewport, filteredRoutes, selectedCourseId, selectedRouteSnapshot],
  );

  const isTrackTabOnly = selectedCategories.has('TRACK') && selectedCategories.size === 1;

  const filteredTracks = useMemo(() => {
    const hasDistanceFilter = Array.from(selectedCategories).some((c) => c !== 'TRACK');
    if (hasDistanceFilter) return [];
    return tracks;
  }, [tracks, selectedCategories]);

  const courseCards = useMemo(
    () => buildCourseCardViews(routesForCourseList, referenceLocation, selectedCourseId),
    [routesForCourseList, referenceLocation, selectedCourseId],
  );

  const courseLikeCounts = useMemo(
    () => buildCourseLikeCountsLookup(allRoutes, selectedCourseId, selectedRouteSnapshot),
    [allRoutes, selectedCourseId, selectedRouteSnapshot],
  );
  const { isCourseLiked, getCourseLikeCount, toggleCourseLike } = useCourseLikes(courseLikeCounts);

  const trackLikeCounts = useMemo(
    () =>
      tracks.reduce<Record<string, number>>((acc, t) => {
        acc[t.id] = t.likes_count;
        return acc;
      }, {}),
    [tracks],
  );
  const { isTrackLiked, getTrackLikeCount, toggleTrackLike } = useTrackLikes(trackLikeCounts);

  const combinedCards = useMemo<HomeListItem[]>(() => {
    if (isTrackTabOnly) {
      return tracks.map((t) => ({
        itemType: 'track' as const,
        data: {
          trackId: t.id,
          title: t.title,
          location:
            t.start_address_region ?? `${t.start_lat.toFixed(4)}, ${t.start_lng.toFixed(4)}`,
          distanceMeters: t.distance_meters,
          likeCount: t.likes_count,
          isSelected: t.id === selectedTrackId,
          thumbnailUrl: t.image_urls[0],
        },
      }));
    }
    if (selectedCategories.size > 0 && !isTrackTabOnly) {
      return courseCards.map((card) => ({ itemType: 'course' as const, data: card }));
    }

    const sortableCourseItems = courseCards.map((card) => ({
      item: { itemType: 'course' as const, data: card } satisfies HomeListItem,
      distanceFromReference: card.distanceFromReference,
    }));

    const sortableTrackItems = tracks.map((t) => ({
      item: {
        itemType: 'track' as const,
        data: {
          trackId: t.id,
          title: t.title,
          location:
            t.start_address_region ?? `${t.start_lat.toFixed(4)}, ${t.start_lng.toFixed(4)}`,
          distanceMeters: t.distance_meters,
          likeCount: t.likes_count,
          isSelected: t.id === selectedTrackId,
          thumbnailUrl: t.image_urls[0],
        },
      } satisfies HomeListItem,
      distanceFromReference: calculateLinearDistanceMeters(referenceLocation, {
        lat: t.start_lat,
        lng: t.start_lng,
      }),
    }));

    const merged = [...sortableCourseItems, ...sortableTrackItems].sort(
      (a, b) => a.distanceFromReference - b.distanceFromReference,
    );

    // 선택된 항목을 최상단으로 고정
    const selectedId = selectedCourseId ?? selectedTrackId;
    if (selectedId) {
      const selectedIdx = merged.findIndex(({ item }) =>
        item.itemType === 'course'
          ? item.data.courseId === selectedId
          : item.data.trackId === selectedId,
      );
      if (selectedIdx > 0) {
        const [selected] = merged.splice(selectedIdx, 1);
        merged.unshift(selected);
      }
    }

    return merged.map(({ item }) => item);
  }, [
    courseCards,
    tracks,
    isTrackTabOnly,
    selectedCategories,
    selectedTrackId,
    selectedCourseId,
    referenceLocation,
  ]);

  const handleCourseMarkerClick = useHomeCourseMarkerClick({
    collapsedPeekHeightThreshold: 24,
    sheetVisibleHeightRef,
    setSelectedCourseId,
    setSelectedTrackId,
    setSelectedRouteSnapshot,
    setMarkerClickRecenterToken,
    setOpenPeekFromCollapsedSignal,
  });

  const handleTrackMarkerClick = useCallback(
    (trackId: string) => {
      setSelectedTrackId(trackId);
      setSelectedCourseId(null);
      if (sheetVisibleHeightRef.current <= 24) {
        setOpenPeekFromCollapsedSignal((prev) => prev + 1);
      }
    },
    [sheetVisibleHeightRef],
  );

  const handleCourseSelect = useCallback(
    (courseId: string) => {
      setSelectedCourseId(courseId);
      snapshotBeforeDetail('course', courseId);
    },
    [snapshotBeforeDetail],
  );

  const handleTrackSelect = useCallback(
    (trackId: string) => {
      snapshotBeforeDetail('track', trackId);
    },
    [snapshotBeforeDetail],
  );

  const handleSheetPositionChange = useCallback(
    ({
      state,
      visibleHeight,
      visualVisibleHeight,
    }: {
      state: 'collapsed' | 'peek' | 'expanded';
      visibleHeight: number;
      visualVisibleHeight: number;
    }) => {
      setIsSheetExpanded(state === 'expanded');
      setSheetVisibleHeight(visibleHeight);
      setSheetVisualVisibleHeight(visualVisibleHeight);
    },
    [],
  );

  return (
    <section className={styles.container}>
      <OnboardingModal />
      <div className={styles.topChrome}>
        <Header
          showLogo
          showLeftIcon={false}
          showRightIcon
          rightIconName="menu"
          rightIconAriaLabel="메뉴 열기"
          onRightIconClick={() => {
            setIsHomeMenuOpen(true);
          }}
          title="루트런"
        />
      </div>
      <Sidebar open={isHomeMenuOpen} onClose={() => setIsHomeMenuOpen(false)} />
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
            bottomSheetVisualVisibleHeight={sheetVisualVisibleHeight}
            isBottomSheetExpanded={isSheetExpanded}
            routes={isTrackTabOnly ? [] : filteredRoutes}
            tracks={filteredTracks}
            initialViewport={restoredInitialViewport}
            selectedCourseId={selectedCourseId}
            markerClickRecenterToken={markerClickRecenterToken}
            onCourseMarkerClick={handleCourseMarkerClick}
            onTrackMarkerClick={handleTrackMarkerClick}
            onVisibleViewportChanged={handleVisibleRouteViewportChanged}
            onZoomLimitReached={handleZoomLimitReached}
            onZoomLimitCleared={handleZoomLimitCleared}
          />
        </div>
        {homeToast ? (
          <div
            className={[
              styles.noCourseToastLayer,
              !isHomeToastFadingOut ? styles.noCourseToastLayerEnter : '',
              isHomeToastFadingOut ? styles.noCourseToastLayerLeaving : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-live="polite"
          >
            <div className={styles.noCourseToast}>
              <span className={styles.noCourseToastIcon}>
                <Icon name="circleAlert" size={16} />
              </span>
              <span>{homeToast.message}</span>
            </div>
          </div>
        ) : null}
        <CoursesList
          cards={combinedCards}
          isLoading={isLoading}
          isRouteQueryViewportReady={effectiveQueryViewport !== null}
          isCourseLiked={isCourseLiked}
          getCourseLikeCount={getCourseLikeCount}
          toggleCourseLike={toggleCourseLike}
          isTrackLiked={isTrackLiked}
          getTrackLikeCount={getTrackLikeCount}
          toggleTrackLike={toggleTrackLike}
          openPeekFromCollapsedSignal={openPeekFromCollapsedSignal}
          onCourseSelect={handleCourseSelect}
          onTrackSelect={handleTrackSelect}
          onSheetPositionChange={handleSheetPositionChange}
        />
      </div>
    </section>
  );
}

export default Home;
