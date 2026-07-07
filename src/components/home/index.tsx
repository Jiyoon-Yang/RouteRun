'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { Icon } from '@/commons/components/icons';
import { TabButton } from '@/commons/components/tab';
import { TAB_ITEMS } from '@/commons/constants/home';
import { Header } from '@/commons/layout/header';
import { Sidebar } from '@/commons/layout/sidebar';
import type { RouteViewport } from '@/commons/types/routerun';
import { HomeList } from '@/components/home-list';
import { TmapHome } from '@/components/tmap/home';

import { useCombinedCards } from './hooks/useCombinedCards';
import { useDistanceCategories } from './hooks/useDistanceCategories';
import { useFrozenViewportSync } from './hooks/useFrozenViewportSync';
import { useHomeLikes } from './hooks/useHomeLikes';
import { useHomeToast } from './hooks/useHomeToast';
import { useReferenceLocation } from './hooks/useReferenceLocation';
import { useRoutes } from './hooks/useRoutes';
import { useSelection } from './hooks/useSelection';
import { useSheetState } from './hooks/useSheetState';
import { useStateSync } from './hooks/useStateSync';
import { useTracks } from './hooks/useTracks';
import { useVisibleViewport } from './hooks/useVisibleViewport';
import { OnboardingModal } from './onboarding-modal';
import styles from './styles.module.css';
import { UsageGuide } from './usage-guide';
import { buildCourseCardViews } from './utils/course-filter';
import {
  computeFilteredRoutesForHome,
  computeRoutesForCourseListForHome,
} from './utils/home-route-derivations';

export function Home() {
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);

  const {
    sheetVisibleHeight,
    sheetVisualVisibleHeight,
    sheetVisibleHeightRef,
    openPeekFromCollapsedSignal,
    setOpenPeekFromCollapsedSignal,
    isSheetExpanded,
    setIsSheetExpanded,
    handleSheetPositionChange,
  } = useSheetState();

  const {
    selectedCourseId,
    setSelectedCourseId,
    selectedTrackId,
    setSelectedTrackId,
    selectedRouteSnapshot,
    markerClickRecenterToken,
    setMarkerClickRecenterToken,
    handleCourseMarkerClick,
    handleTrackMarkerClick,
  } = useSelection({ sheetVisibleHeightRef, setOpenPeekFromCollapsedSignal });

  const { selectedCategories, setSelectedCategories, toggleCategory } = useDistanceCategories();

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

  const handleVisibleRouteViewportChanged = useVisibleViewport(setVisibleRouteViewport);

  useFrozenViewportSync({
    isSheetExpanded,
    visibleRouteViewport,
    setFrozenVisibleRouteViewport,
  });

  const { snapshotBeforeDetail } = useStateSync({
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

  const courseCards = useMemo(
    () => buildCourseCardViews(routesForCourseList, referenceLocation, selectedCourseId),
    [routesForCourseList, referenceLocation, selectedCourseId],
  );

  const { isTrackTabOnly, filteredTracks, combinedCards } = useCombinedCards({
    courseCards,
    tracks,
    selectedCategories,
    selectedCourseId,
    selectedTrackId,
    referenceLocation,
  });

  const {
    isCourseLiked,
    getCourseLikeCount,
    toggleCourseLike,
    isTrackLiked,
    getTrackLikeCount,
    toggleTrackLike,
  } = useHomeLikes({
    allRoutes,
    tracks,
    selectedCourseId,
    selectedRouteSnapshot,
  });

  const handleCourseSelect = useCallback(
    (courseId: string) => {
      setSelectedCourseId(courseId);
      snapshotBeforeDetail('course', courseId);
    },
    [snapshotBeforeDetail, setSelectedCourseId],
  );

  const handleTrackSelect = useCallback(
    (trackId: string) => {
      snapshotBeforeDetail('track', trackId);
    },
    [snapshotBeforeDetail],
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
          rightSlot={<UsageGuide />}
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
        <HomeList
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
