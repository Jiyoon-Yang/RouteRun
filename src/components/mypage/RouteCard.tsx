'use client';

import { useRouter } from 'next/navigation';

import { Card } from '@/commons/components/card';
import { ROUTES } from '@/commons/constants/url';
import type { MypageRouteCardData, MypageTab } from '@/commons/types/mypage';

import { useDeleteCourse } from './hooks/useDeleteCourse';

export type RouteCardProps = {
  tab: MypageTab;
  route: MypageRouteCardData;
  isCourseLiked?: (courseId: string) => boolean;
  getCourseLikeCount?: (courseId: string) => number;
  toggleCourseLike?: (courseId: string) => void;
};

export function RouteCard({
  tab,
  route,
  isCourseLiked,
  getCourseLikeCount,
  toggleCourseLike,
}: RouteCardProps) {
  const router = useRouter();
  const { isDeleting, deleteCourse } = useDeleteCourse();
  const isMyCourse = tab === 'my-posts';
  const locationText = route.start_address_region ?? '위치 정보 없음';
  const isLiked = !isMyCourse && (isCourseLiked?.(route.id) ?? true);
  const likeCount = getCourseLikeCount?.(route.id) ?? route.likeCount;

  const secondaryActionLabel = isMyCourse ? undefined : isLiked ? '좋아요 취소' : '좋아요';

  return (
    <Card
      type={isMyCourse ? 'my-course' : 'liked-course'}
      isLiked={isLiked}
      readonlyLike={true}
      title={route.title}
      location={locationText}
      distanceText={route.distanceText}
      likeCount={likeCount}
      thumbnailUrl={route.thumbnailUrl}
      primaryActionLabel={isMyCourse ? '상세보기' : undefined}
      onPrimaryActionClick={() => {
        router.push(ROUTES.COURSES.DETAIL(route.id));
      }}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryActionClick={() => {
        if (isMyCourse) {
          deleteCourse(route.id);
        } else {
          toggleCourseLike?.(route.id);
        }
      }}
      secondaryActionDisabled={isMyCourse && isDeleting}
    />
  );
}
