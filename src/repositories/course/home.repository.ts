// 홈 페이지 지도용 코스 데이터 통신 전담
import type { Route, RouteViewport } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/client';

import { ROUTE_SELECT, normalizeRouteRows, type RouteRow } from './route-row';

// 화면 모서리·바텀시트 인접 코스를 미리 받아오기 위한 가시 뷰포트 확장 비율
const VIEWPORT_PADDING_RATIO = 0.3;

export async function getHomeRoutesByViewport(viewport: RouteViewport): Promise<Route[]> {
  const supabase = createClient();
  const rawMinLat = Math.min(viewport.northEastLat, viewport.southWestLat);
  const rawMaxLat = Math.max(viewport.northEastLat, viewport.southWestLat);
  const rawMinLng = Math.min(viewport.northEastLng, viewport.southWestLng);
  const rawMaxLng = Math.max(viewport.northEastLng, viewport.southWestLng);

  const latPadding = (rawMaxLat - rawMinLat) * VIEWPORT_PADDING_RATIO;
  const lngPadding = (rawMaxLng - rawMinLng) * VIEWPORT_PADDING_RATIO;

  const minLat = rawMinLat - latPadding;
  const maxLat = rawMaxLat + latPadding;
  const minLng = rawMinLng - lngPadding;
  const maxLng = rawMaxLng + lngPadding;

  const { data, error } = await supabase
    .from('routes')
    .select(ROUTE_SELECT)
    .gte('start_lat', minLat)
    .lte('start_lat', maxLat)
    .gte('start_lng', minLng)
    .lte('start_lng', maxLng)
    .returns<RouteRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRouteRows(data);
}
