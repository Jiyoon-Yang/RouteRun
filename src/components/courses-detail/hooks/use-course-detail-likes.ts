'use client';

import { useMemo } from 'react';

import type { Route } from '@/commons/types/runroute';
import { useCourseLikes } from '@/hooks/useCourseLikes';

/** 단일 코스 상세의 찜 수·토글을 `useCourseLikes`에 맞게 래핑 */
export function useCourseDetailLikes(course: Route) {
  const courseLikeCounts = useMemo(
    () => ({ [course.id]: course.likes_count ?? 0 }),
    [course.id, course.likes_count],
  );
  return useCourseLikes(courseLikeCounts);
}
