// 홈 코스 목록 바텀시트용 — 카드 뷰를 정렬 모드에 맞게 재배열한다.
import type { CourseCardView, HomeListItem } from '@/commons/types/routerun';
import { pinToTopIfVisible } from '@/components/home/utils/course-filter';

export type CourseListSortMode = 'distance' | 'likes';

/** 거리순은 부모에서 정렬된 `cards` 순서를 유지하고, 좋아요순은 재정렬 후 선택 핀을 복원한다. */
export function sortCourseCardsForDisplay(
  cards: CourseCardView[],
  mode: CourseListSortMode,
  getCourseLikeCount?: (courseId: string) => number,
): CourseCardView[] {
  if (mode === 'distance') {
    return cards;
  }

  const pinnedCourseId = cards.find((card) => card.isPinnedTop)?.courseId ?? null;
  const stripped = cards.map((card) => ({ ...card, isPinnedTop: false }));
  const sorted = [...stripped].sort((left, right) => {
    const likesLeft = getCourseLikeCount?.(left.courseId) ?? left.likeCount;
    const likesRight = getCourseLikeCount?.(right.courseId) ?? right.likeCount;
    if (likesRight !== likesLeft) {
      return likesRight - likesLeft;
    }
    return left.title.localeCompare(right.title, 'ko');
  });

  return pinToTopIfVisible(sorted, pinnedCourseId);
}

function getHomeItemLikeCount(
  item: HomeListItem,
  getCourseLikeCount?: (id: string) => number,
  getTrackLikeCount?: (id: string) => number,
): number {
  if (item.itemType === 'course') {
    return getCourseLikeCount?.(item.data.courseId) ?? item.data.likeCount;
  }
  return getTrackLikeCount?.(item.data.trackId) ?? item.data.likeCount;
}

function getHomeItemTitle(item: HomeListItem): string {
  return item.data.title;
}

/** 코스+트랙 통합 리스트 정렬. 거리순은 입력 순서 유지, 좋아요순은 내림차순 재정렬. */
export function sortHomeListCardsForDisplay(
  cards: HomeListItem[],
  mode: CourseListSortMode,
  getCourseLikeCount?: (courseId: string) => number,
  getTrackLikeCount?: (trackId: string) => number,
): HomeListItem[] {
  if (mode === 'distance') {
    return cards;
  }

  const pinnedCourseId =
    cards.find(
      (item): item is Extract<HomeListItem, { itemType: 'course' }> =>
        item.itemType === 'course' && item.data.isPinnedTop,
    )?.data.courseId ?? null;

  const pinnedTrackId =
    cards.find(
      (item): item is Extract<HomeListItem, { itemType: 'track' }> =>
        item.itemType === 'track' && item.data.isSelected,
    )?.data.trackId ?? null;

  const stripped = cards.map((item) => {
    if (item.itemType === 'course') return { ...item, data: { ...item.data, isPinnedTop: false } };
    if (item.itemType === 'track') return { ...item, data: { ...item.data, isSelected: false } };
    return item;
  });

  const sorted = [...stripped].sort((left, right) => {
    const likesLeft = getHomeItemLikeCount(left, getCourseLikeCount, getTrackLikeCount);
    const likesRight = getHomeItemLikeCount(right, getCourseLikeCount, getTrackLikeCount);
    if (likesRight !== likesLeft) return likesRight - likesLeft;
    return getHomeItemTitle(left).localeCompare(getHomeItemTitle(right), 'ko');
  });

  let result = sorted;

  if (pinnedCourseId) {
    const idx = result.findIndex(
      (item) => item.itemType === 'course' && item.data.courseId === pinnedCourseId,
    );
    if (idx >= 0) {
      const item = result[idx];
      const pinned: HomeListItem = {
        itemType: 'course',
        data: {
          ...(item.data as Extract<HomeListItem, { itemType: 'course' }>['data']),
          isPinnedTop: true,
        },
      };
      result = [pinned, ...result.filter((_, i) => i !== idx)];
    }
  }

  if (pinnedTrackId) {
    const insertAt = pinnedCourseId ? 1 : 0;
    const idx = result.findIndex(
      (item) => item.itemType === 'track' && item.data.trackId === pinnedTrackId,
    );
    if (idx >= 0) {
      const item = result[idx];
      const pinned: HomeListItem = {
        itemType: 'track',
        data: {
          ...(item.data as Extract<HomeListItem, { itemType: 'track' }>['data']),
          isSelected: true,
        },
      };
      const without = result.filter((_, i) => i !== idx);
      result = [...without.slice(0, insertAt), pinned, ...without.slice(insertAt)];
    }
  }

  return result;
}
