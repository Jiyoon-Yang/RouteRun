'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * 홈 바텀시트 상태(가시 높이/펼침 여부/피크 오픈 시그널)와 위치 변경 핸들러를 관리한다.
 * - `sheetVisibleHeightRef`는 렌더 중 최신 높이를 동기화해 콜백에서 참조한다.
 */
export function useSheetState() {
  const [sheetVisibleHeight, setSheetVisibleHeight] = useState(260);
  const [sheetVisualVisibleHeight, setSheetVisualVisibleHeight] = useState(260);
  const sheetVisibleHeightRef = useRef(sheetVisibleHeight);
  sheetVisibleHeightRef.current = sheetVisibleHeight;
  const [openPeekFromCollapsedSignal, setOpenPeekFromCollapsedSignal] = useState(0);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

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

  return {
    sheetVisibleHeight,
    sheetVisualVisibleHeight,
    sheetVisibleHeightRef,
    openPeekFromCollapsedSignal,
    setOpenPeekFromCollapsedSignal,
    isSheetExpanded,
    setIsSheetExpanded,
    handleSheetPositionChange,
  };
}
