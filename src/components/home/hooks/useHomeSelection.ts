'use client';

import {
  useCallback,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';

import type { Route } from '@/commons/types/routerun';

import { useHomeCourseMarkerClick } from './useHomeCourseMarkerClick';

interface UseHomeSelectionParams {
  sheetVisibleHeightRef: MutableRefObject<number>;
  setOpenPeekFromCollapsedSignal: Dispatch<SetStateAction<number>>;
}

/**
 * 홈에서 선택된 코스/트랙과 지도 마커 상호작용 상태를 관리한다.
 * - `selectedRouteSnapshot`: 뷰포트 밖으로 이동해도 선택 코스를 유지하기 위한 스냅샷
 * - `markerClickRecenterToken`: 마커 클릭 시 지도 재중심을 트리거하는 토큰
 */
export function useHomeSelection({
  sheetVisibleHeightRef,
  setOpenPeekFromCollapsedSignal,
}: UseHomeSelectionParams) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedRouteSnapshot, setSelectedRouteSnapshot] = useState<Route | null>(null);
  const [markerClickRecenterToken, setMarkerClickRecenterToken] = useState(0);

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
    [sheetVisibleHeightRef, setOpenPeekFromCollapsedSignal],
  );

  return {
    selectedCourseId,
    setSelectedCourseId,
    selectedTrackId,
    setSelectedTrackId,
    selectedRouteSnapshot,
    setSelectedRouteSnapshot,
    markerClickRecenterToken,
    setMarkerClickRecenterToken,
    handleCourseMarkerClick,
    handleTrackMarkerClick,
  };
}
