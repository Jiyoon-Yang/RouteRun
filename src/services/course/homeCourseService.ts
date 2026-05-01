// 홈 페이지 지도용 코스 비즈니스 로직
import type { Route } from '@/commons/types/runroute';
import { getHomeRoutes } from '@/repositories/course/home.repository';

export async function fetchHomeRoutes(): Promise<Route[]> {
  return getHomeRoutes();
}
