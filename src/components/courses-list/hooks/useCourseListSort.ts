'use client';

import { useCallback, useMemo, useState } from 'react';

import type { HomeListItem } from '@/commons/types/routerun';

import { sortHomeListCardsForDisplay, type CourseListSortMode } from '../utils/sort-course-cards';

export function useCourseListSort(
  cards: HomeListItem[],
  getCourseLikeCount?: (courseId: string) => number,
  getTrackLikeCount?: (trackId: string) => number,
) {
  const [sortMode, setSortMode] = useState<CourseListSortMode>('distance');

  const displayCards = useMemo(
    () => sortHomeListCardsForDisplay(cards, sortMode, getCourseLikeCount, getTrackLikeCount),
    [cards, getCourseLikeCount, getTrackLikeCount, sortMode],
  );

  const selectSortMode = useCallback((mode: CourseListSortMode) => {
    setSortMode(mode);
  }, []);

  return { sortMode, displayCards, selectSortMode };
}
