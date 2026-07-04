import { useMemo } from 'react';

import type {
  CourseCardView,
  HomeListItem,
  ReferenceLocation,
  Track,
} from '@/commons/types/routerun';
import type { DistanceCategory } from '@/commons/utils/distance/category';
import { calculateLinearDistanceMeters } from '@/commons/utils/geo';

import { buildTrackCardView } from '../utils/home-track-cards';

interface UseHomeCombinedCardsParams {
  courseCards: CourseCardView[];
  tracks: Track[];
  selectedCategories: Set<DistanceCategory>;
  selectedCourseId: string | null;
  selectedTrackId: string | null;
  referenceLocation: ReferenceLocation;
}

interface UseHomeCombinedCardsResult {
  isTrackTabOnly: boolean;
  filteredTracks: Track[];
  combinedCards: HomeListItem[];
}

/**
 * 홈 리스트에 뿌릴 코스·트랙 카드를 조합한다.
 * - 트랙 탭만 선택: 트랙만
 * - 거리 필터 존재: 코스만
 * - 필터 없음: 코스+트랙을 기준점 거리순 병합 후 선택 항목 최상단 고정
 */
export function useCombinedCards({
  courseCards,
  tracks,
  selectedCategories,
  selectedCourseId,
  selectedTrackId,
  referenceLocation,
}: UseHomeCombinedCardsParams): UseHomeCombinedCardsResult {
  const isTrackTabOnly = selectedCategories.has('TRACK') && selectedCategories.size === 1;

  const filteredTracks = useMemo(() => {
    const hasDistanceFilter = Array.from(selectedCategories).some((c) => c !== 'TRACK');
    if (hasDistanceFilter) return [];
    return tracks;
  }, [tracks, selectedCategories]);

  const combinedCards = useMemo<HomeListItem[]>(() => {
    if (isTrackTabOnly) {
      return tracks.map((t) => buildTrackCardView(t, selectedTrackId));
    }
    if (selectedCategories.size > 0 && !isTrackTabOnly) {
      return courseCards.map((card) => ({ itemType: 'course' as const, data: card }));
    }

    const sortableCourseItems = courseCards.map((card) => ({
      item: { itemType: 'course' as const, data: card } satisfies HomeListItem,
      distanceFromReference: card.distanceFromReference,
    }));

    const sortableTrackItems = tracks.map((t) => ({
      item: buildTrackCardView(t, selectedTrackId),
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

  return { isTrackTabOnly, filteredTracks, combinedCards };
}
