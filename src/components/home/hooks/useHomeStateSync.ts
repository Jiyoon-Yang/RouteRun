'use client';

// 홈 URL 쿼리·sessionStorage와 선택 상태 동기화, 상세 진입 전 히스토리 스냅샷을 담당한다.
// selectedCourseId / selectedTrackId는 sessionStorage로만 관리 (URL에서 제거).

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

import { HOME_QUERY_KEYS, HOME_SESSION_KEYS, TAB_ITEMS } from '@/commons/constants/home';
import type { RouteViewport } from '@/commons/types/routerun';
import type { DistanceCategory } from '@/commons/utils/distance/category';
import { isValidRouteViewport } from '@/commons/utils/viewport/route-viewport';

import {
  areDistanceCategorySetsEqual,
  parseDistanceCategoriesFromQuery,
  resolveHomeSearchParamsForRead,
} from '../utils/home-url-sync-helpers';

import type { ReadonlyURLSearchParams } from 'next/navigation';

type UseHomeUrlSyncParams = {
  searchParams: ReadonlyURLSearchParams | null;
  pathname: string;
  router: { replace: (href: string, options?: { scroll?: boolean }) => void };
  selectedCategories: Set<DistanceCategory>;
  isSheetExpanded: boolean;
  setSelectedCourseId: Dispatch<SetStateAction<string | null>>;
  setSelectedTrackId: Dispatch<SetStateAction<string | null>>;
  setSelectedCategories: Dispatch<SetStateAction<Set<DistanceCategory>>>;
  setIsSheetExpanded: Dispatch<SetStateAction<boolean>>;
  setVisibleRouteViewport: Dispatch<SetStateAction<RouteViewport | null>>;
  setFrozenVisibleRouteViewport: Dispatch<SetStateAction<RouteViewport | null>>;
  setRestoredInitialViewport: Dispatch<SetStateAction<RouteViewport | null>>;
  setMarkerClickRecenterToken: Dispatch<SetStateAction<number>>;
  visibleRouteViewport: RouteViewport | null;
  effectiveQueryViewport: RouteViewport | null;
  frozenVisibleRouteViewport: RouteViewport | null;
};

/** 쿼리·세션 복원, URL 동기화, 상세 진입 전 히스토리 스냅샷 (순수 로직은 `home-url-sync-helpers`) */
export function useHomeStateSync({
  searchParams,
  pathname,
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
}: UseHomeUrlSyncParams) {
  const lastSyncedQueryRef = useRef('');
  const allowStateToUrlSyncRef = useRef(false);
  const didApplyViewportFromSessionRef = useRef(false);
  const didApplySelectedIdFromSessionRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // selectedCourseId / selectedTrackId 세션스토리지 복원 (1회)
    if (!didApplySelectedIdFromSessionRef.current) {
      didApplySelectedIdFromSessionRef.current = true;

      const savedCourseId = window.sessionStorage.getItem(HOME_SESSION_KEYS.savedCourseId);
      const savedTrackId = window.sessionStorage.getItem(HOME_SESSION_KEYS.savedTrackId);
      const shouldRestoreSelectedFocusOnce =
        window.sessionStorage.getItem(HOME_SESSION_KEYS.restoreSelectedFocusOnce) === '1';

      if (savedCourseId) {
        setSelectedCourseId(savedCourseId);
        window.sessionStorage.removeItem(HOME_SESSION_KEYS.savedCourseId);
        if (shouldRestoreSelectedFocusOnce) {
          setMarkerClickRecenterToken((previous) => previous + 1);
          window.sessionStorage.removeItem(HOME_SESSION_KEYS.restoreSelectedFocusOnce);
        }
      }
      if (savedTrackId) {
        setSelectedTrackId(savedTrackId);
        window.sessionStorage.removeItem(HOME_SESSION_KEYS.savedTrackId);
      }
    }

    const merged = resolveHomeSearchParamsForRead(pathname, searchParams);

    const categoriesRaw = merged.get(HOME_QUERY_KEYS.categories);
    if (categoriesRaw) {
      const parsed = parseDistanceCategoriesFromQuery(categoriesRaw);
      setSelectedCategories((previous) =>
        areDistanceCategorySetsEqual(previous, parsed) ? previous : parsed,
      );
    }

    if (merged.get(HOME_QUERY_KEYS.sheet) === 'expanded') {
      setIsSheetExpanded((previous) => (previous ? previous : true));
    }

    const shouldRestoreViewportOnce =
      window.sessionStorage.getItem(HOME_SESSION_KEYS.restoreViewportOnce) === '1';
    if (shouldRestoreViewportOnce && !didApplyViewportFromSessionRef.current) {
      didApplyViewportFromSessionRef.current = true;
      const rawViewport = window.sessionStorage.getItem(HOME_SESSION_KEYS.savedViewport);
      if (rawViewport) {
        try {
          const parsed = JSON.parse(rawViewport) as RouteViewport;
          if (isValidRouteViewport(parsed)) {
            setVisibleRouteViewport(parsed);
            setFrozenVisibleRouteViewport(parsed);
            setRestoredInitialViewport(parsed);
          }
        } catch {
          // 손상된 저장값은 무시
        }
      }
      window.sessionStorage.removeItem(HOME_SESSION_KEYS.restoreViewportOnce);
    }

    allowStateToUrlSyncRef.current = true;
  }, [
    pathname,
    searchParams,
    setFrozenVisibleRouteViewport,
    setIsSheetExpanded,
    setMarkerClickRecenterToken,
    setRestoredInitialViewport,
    setSelectedCategories,
    setSelectedCourseId,
    setSelectedTrackId,
    setVisibleRouteViewport,
  ]);

  /** categories + sheet만 URL에 동기화 (courseId/trackId는 URL에서 제거) */
  useEffect(() => {
    if (!allowStateToUrlSyncRef.current) return;

    const params = new URLSearchParams();
    if (selectedCategories.size > 0) {
      const encodedCategories = TAB_ITEMS.map((item) => item.category).filter((category) =>
        selectedCategories.has(category),
      );
      params.set(HOME_QUERY_KEYS.categories, encodedCategories.join(','));
    }
    if (isSheetExpanded) {
      params.set(HOME_QUERY_KEYS.sheet, 'expanded');
    }
    const nextQuery = params.toString();
    const currentQuery = searchParams?.toString() ?? '';
    if (nextQuery === currentQuery) {
      lastSyncedQueryRef.current = nextQuery;
      return;
    }
    if (lastSyncedQueryRef.current === nextQuery) return;
    lastSyncedQueryRef.current = nextQuery;
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [isSheetExpanded, pathname, router, searchParams, selectedCategories]);

  /** 상세 페이지 진입 직전: id를 sessionStorage에 저장하고 뷰포트·URL 상태 스냅샷 */
  const snapshotBeforeDetail = useCallback(
    (type: 'course' | 'track', id: string) => {
      if (typeof window === 'undefined') return;

      if (type === 'course') {
        window.sessionStorage.setItem(HOME_SESSION_KEYS.savedCourseId, id);
        window.sessionStorage.setItem(HOME_SESSION_KEYS.restoreSelectedFocusOnce, '1');
      } else {
        window.sessionStorage.setItem(HOME_SESSION_KEYS.savedTrackId, id);
      }

      const viewportForSnapshot =
        visibleRouteViewport ?? effectiveQueryViewport ?? frozenVisibleRouteViewport;
      if (isValidRouteViewport(viewportForSnapshot)) {
        window.sessionStorage.setItem(
          HOME_SESSION_KEYS.savedViewport,
          JSON.stringify(viewportForSnapshot),
        );
        window.sessionStorage.setItem(HOME_SESSION_KEYS.restoreViewportOnce, '1');
      } else {
        const hasSavedViewport = Boolean(
          window.sessionStorage.getItem(HOME_SESSION_KEYS.savedViewport),
        );
        if (hasSavedViewport) {
          window.sessionStorage.setItem(HOME_SESSION_KEYS.restoreViewportOnce, '1');
        } else {
          window.sessionStorage.removeItem(HOME_SESSION_KEYS.restoreViewportOnce);
        }
      }

      // categories + sheet URL 상태를 history에 동기화 (비동기 replace보다 먼저 반영)
      const params = new URLSearchParams();
      if (selectedCategories.size > 0) {
        const encodedCategories = TAB_ITEMS.map((item) => item.category).filter((category) =>
          selectedCategories.has(category),
        );
        params.set(HOME_QUERY_KEYS.categories, encodedCategories.join(','));
      }
      if (isSheetExpanded) {
        params.set(HOME_QUERY_KEYS.sheet, 'expanded');
      }
      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl !== nextUrl) {
        window.history.replaceState(window.history.state, '', nextUrl);
        lastSyncedQueryRef.current = nextQuery;
      }
    },
    [
      effectiveQueryViewport,
      frozenVisibleRouteViewport,
      isSheetExpanded,
      pathname,
      selectedCategories,
      visibleRouteViewport,
    ],
  );

  return { snapshotBeforeDetail };
}
