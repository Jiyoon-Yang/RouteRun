import { useMemo } from 'react';

import { toggleCourseLikeAction } from '@/actions/course.action';
import { toggleTrackLikeAction } from '@/actions/track.action';
import { useLikes } from '@/commons/hooks/useLikes';
import type { Route, Track } from '@/commons/types/routerun';
import { fetchLikedCourseIds } from '@/services/course/courseLikeService';
import { fetchLikedTrackIds } from '@/services/track/trackLikeService';

import { buildCourseLikeCountsLookup } from '../utils/home-like-counts';

interface UseHomeLikesParams {
  allRoutes: Route[];
  tracks: Track[];
  selectedCourseId: string | null;
  selectedRouteSnapshot: Route | null;
}

/** 홈 코스·트랙 좋아요 상태/카운트/토글을 한 번에 제공 */
export function useHomeLikes({
  allRoutes,
  tracks,
  selectedCourseId,
  selectedRouteSnapshot,
}: UseHomeLikesParams) {
  const courseLikeCounts = useMemo(
    () => buildCourseLikeCountsLookup(allRoutes, selectedCourseId, selectedRouteSnapshot),
    [allRoutes, selectedCourseId, selectedRouteSnapshot],
  );
  const {
    isLiked: isCourseLiked,
    getLikeCount: getCourseLikeCount,
    toggleLike: toggleCourseLike,
  } = useLikes(courseLikeCounts, {
    entityLabel: '코스',
    fetchLikedIds: fetchLikedCourseIds,
    toggleAction: toggleCourseLikeAction,
  });

  const trackLikeCounts = useMemo(
    () =>
      tracks.reduce<Record<string, number>>((acc, t) => {
        acc[t.id] = t.likes_count;
        return acc;
      }, {}),
    [tracks],
  );
  const {
    isLiked: isTrackLiked,
    getLikeCount: getTrackLikeCount,
    toggleLike: toggleTrackLike,
  } = useLikes(trackLikeCounts, {
    entityLabel: '트랙',
    fetchLikedIds: fetchLikedTrackIds,
    toggleAction: toggleTrackLikeAction,
  });

  return {
    isCourseLiked,
    getCourseLikeCount,
    toggleCourseLike,
    isTrackLiked,
    getTrackLikeCount,
    toggleTrackLike,
  };
}
