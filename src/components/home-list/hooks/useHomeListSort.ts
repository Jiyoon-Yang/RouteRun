'use client';

import { useCallback, useMemo, useState } from 'react';

import type { HomeListItem } from '@/commons/types/routerun';

import { sortHomeListCardsForDisplay, type HomeListSortMode } from '../utils/sort-home-list';

export function useHomeListSort(
  cards: HomeListItem[],
  getCourseLikeCount?: (courseId: string) => number,
  getTrackLikeCount?: (trackId: string) => number,
) {
  const [sortMode, setSortMode] = useState<HomeListSortMode>('distance');

  const displayCards = useMemo(
    () => sortHomeListCardsForDisplay(cards, sortMode, getCourseLikeCount, getTrackLikeCount),
    [cards, getCourseLikeCount, getTrackLikeCount, sortMode],
  );

  const selectSortMode = useCallback((mode: HomeListSortMode) => {
    setSortMode(mode);
  }, []);

  return { sortMode, displayCards, selectSortMode };
}
