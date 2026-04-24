// 코스 비즈니스 로직
// 데이터 가공, 권한 체크 등

import type { MypageRouteCardData } from '@/commons/types/mypage';
import type { Route } from '@/commons/types/runroute';
import * as courseRepository from '@/repositories/course.repository';

import type { SupabaseClient } from '@supabase/supabase-js';

function routeToMypageCard(route: Route): MypageRouteCardData {
  return {
    id: route.id,
    title: route.title,
    location: `시작 좌표 ${route.start_lat.toFixed(4)}, ${route.start_lng.toFixed(4)}`,
    distanceText: `${(route.distance_meters / 1000).toFixed(1)}km`,
    likeCount: route.likes_count,
  };
}

/**
 * 마이페이지용: 내 코스·좋아요 코스를 병렬로 조회해 카드 뷰 모델로 반환한다.
 */
export async function fetchMypageRouteLists(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  myRoutes: MypageRouteCardData[];
  likedRoutes: MypageRouteCardData[];
}> {
  const [myResult, likedResult] = await Promise.all([
    courseRepository.getRoutesByUserId(supabase, userId),
    courseRepository.getLikedRoutesByUserId(supabase, userId),
  ]);

  if (myResult.error) {
    console.error('[courseService] 내 코스 조회 실패:', myResult.error);
  }
  if (likedResult.error) {
    console.error('[courseService] 좋아요 코스 조회 실패:', likedResult.error);
  }

  return {
    myRoutes: myResult.data.map(routeToMypageCard),
    likedRoutes: likedResult.data.map(routeToMypageCard),
  };
}
