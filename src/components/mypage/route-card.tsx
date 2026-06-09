'use client';

import { useRouter } from 'next/navigation';

import { Card } from '@/commons/components/card';
import { ROUTES } from '@/commons/constants/url';
import type { MypageRouteCardData, MypageTab } from '@/commons/types/mypage';

import { deleteCourseAction } from '@/actions/course.action';

import { useDeleteItem } from './hooks/useDeleteItem';

const COURSE_DELETE_CONFIG = {
  confirmTitle: '코스를 삭제하시겠습니까?',
  successTitle: '코스가 삭제되었습니다.',
  errorMessage: '코스 삭제에 실패했습니다. 다시 시도해 주세요.',
  deleteAction: deleteCourseAction,
} as const;

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
  const { isDeleting, deleteItem: deleteCourse } = useDeleteItem(COURSE_DELETE_CONFIG);
  const isMyCourse = tab === 'my-posts';
  const locationText = route.start_address_region ?? '위치 정보 없음';
  const isLiked = isCourseLiked?.(route.id) ?? false;
  const likeCount = getCourseLikeCount?.(route.id) ?? route.likeCount;

  const secondaryActionLabel = isMyCourse ? undefined : isLiked ? '좋아요 취소' : '좋아요';

  return (
    <Card
      type={isMyCourse ? 'my-course' : 'liked-course'}
      itemKind="course"
      isLiked={isLiked}
      onLikeClick={() => toggleCourseLike?.(route.id)}
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
