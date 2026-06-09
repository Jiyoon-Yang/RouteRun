'use client';

import { useMemo } from 'react';

import { toggleCourseLikeAction } from '@/actions/course.action';
import { useLikes } from '@/commons/hooks/useLikes';
import type { Route } from '@/commons/types/routerun';
import { fetchLikedCourseIds } from '@/services/course/courseLikeService';

const COURSE_LIKE_CONFIG = {
  entityLabel: '코스',
  fetchLikedIds: fetchLikedCourseIds,
  toggleAction: toggleCourseLikeAction,
} as const;

export function useCourseDetailLikes(course: Route) {
  const courseLikeCounts = useMemo(
    () => ({ [course.id]: course.likes_count ?? 0 }),
    [course.id, course.likes_count],
  );
  const { isLiked, getLikeCount, toggleLike } = useLikes(courseLikeCounts, COURSE_LIKE_CONFIG);
  return {
    isCourseLiked: isLiked,
    getCourseLikeCount: getLikeCount,
    toggleCourseLike: toggleLike,
  };
}
