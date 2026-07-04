'use client';

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';

import type { Route } from '@/commons/types/routerun';

/** 접힘 상태에서 피크 시트를 열 때 기준 높이(px) — 이 값 이하면 피크 오픈 시그널 증가 */
const COLLAPSED_PEEK_HEIGHT_THRESHOLD = 24;

interface UseSelectionParams {
  sheetVisibleHeightRef: MutableRefObject<number>;
  setOpenPeekFromCollapsedSignal: Dispatch<SetStateAction<number>>;
}

/**
 * 홈에서 선택된 코스/트랙과 지도 마커 상호작용 상태를 관리한다.
 * - `selectedRouteSnapshot`: 뷰포트 밖으로 이동해도 선택 코스를 유지하기 위한 스냅샷
 * - `markerClickRecenterToken`: 마커 클릭 시 지도 재중심을 트리거하는 토큰
 * - 마커 클릭 시 시트가 거의 닫힌 상태면 피크 시트 오픈 시그널을 증가시킨다.
 */
export function useSelection({
  sheetVisibleHeightRef,
  setOpenPeekFromCollapsedSignal,
}: UseSelectionParams) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedRouteSnapshot, setSelectedRouteSnapshot] = useState<Route | null>(null);
  const [markerClickRecenterToken, setMarkerClickRecenterToken] = useState(0);

  // 선택 코스 id가 없어질 때만 스냅샷을 비운다.
  // id 불일치 시 곧바로 null로 두면 URL·상태 갱신 한 틱 어긋남으로 뷰포트 밖 병합이 깨져 마커가 사라질 수 있다.
  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedRouteSnapshot(null);
    }
  }, [selectedCourseId]);

  const handleCourseMarkerClick = useCallback(
    (courseId: string, route: Route) => {
      setSelectedCourseId(courseId);
      setSelectedTrackId(null);
      setSelectedRouteSnapshot(route);
      setMarkerClickRecenterToken((previous) => previous + 1);
      if (sheetVisibleHeightRef.current <= COLLAPSED_PEEK_HEIGHT_THRESHOLD) {
        setOpenPeekFromCollapsedSignal((previous) => previous + 1);
      }
    },
    [sheetVisibleHeightRef, setOpenPeekFromCollapsedSignal],
  );

  const handleTrackMarkerClick = useCallback(
    (trackId: string) => {
      setSelectedTrackId(trackId);
      setSelectedCourseId(null);
      if (sheetVisibleHeightRef.current <= COLLAPSED_PEEK_HEIGHT_THRESHOLD) {
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
