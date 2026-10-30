// 홈 페이지 지도용 코스 데이터 통신 전담
import type { Route, RouteViewport } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/client';

import { ROUTE_SELECT, normalizeRouteRows, type RouteRow } from './route-row';

// 화면 모서리·바텀시트 인접 코스를 미리 받아오기 위한 가시 뷰포트 확장 비율
const VIEWPORT_PADDING_RATIO = 0.3;

// 목록·마커에는 첫 웨이포인트만 필요하므로 무거운 path_data 전체 대신 그 한 점만 받는다.
// 선택한 코스의 상세 경로는 getHomeRoutePathData로 따로 조회한다.
const HOME_ROUTE_SELECT = ROUTE_SELECT.replace(
  'path_data',
  'waypoint_start:path_data->waypoint_points->0',
);

type HomeRouteRow = Omit<RouteRow, 'path_data'> & {
  waypoint_start: { lat: number; lng: number } | null;
};

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
    .select(HOME_ROUTE_SELECT)
    .gte('start_lat', minLat)
    .lte('start_lat', maxLat)
    .gte('start_lng', minLng)
    .lte('start_lng', maxLng)
    .returns<HomeRouteRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRouteRows(
    (data ?? []).map(({ waypoint_start, ...row }) => ({
      ...row,
      path_data: waypoint_start ? { waypoint_points: [waypoint_start] } : null,
    })),
  );
}

/** 홈에서 선택한 코스 하나의 상세 경로(`path_data`) */
export async function getHomeRoutePathData(
  routeId: string,
): Promise<Record<string, unknown> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('routes')
    .select('path_data')
    .eq('id', routeId)
    .maybeSingle<{ path_data: Record<string, unknown> | null }>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.path_data ?? null;
}
