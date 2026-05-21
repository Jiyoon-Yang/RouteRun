// 홈 페이지 지도용 코스 데이터 통신 전담
import type { Route, RouteViewport } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/client';

type RouteRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  distance_meters: number | null;
  path_data: Record<string, unknown> | null;
  start_lat: number | null;
  start_lng: number | null;
  start_address_region: string | null;
  image_urls: string[] | null;
  likes_count: number | null;
  is_round_trip: boolean | null;
  created_at: string | null;
};

const ROUTE_SELECT =
  'id, user_id, title, description, distance_meters, path_data, start_lat, start_lng, start_address_region, image_urls, likes_count, is_round_trip, created_at';

// 화면 모서리·바텀시트 인접 코스를 미리 받아오기 위한 가시 뷰포트 확장 비율
const VIEWPORT_PADDING_RATIO = 0.3;

function toRoute(row: RouteRow): Route | null {
  if (
    !row.id ||
    !row.user_id ||
    !row.title ||
    row.distance_meters === null ||
    row.start_lat === null ||
    row.start_lng === null ||
    !row.created_at
  ) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    distance_meters: row.distance_meters,
    path_data: row.path_data ?? {},
    start_lat: row.start_lat,
    start_lng: row.start_lng,
    start_address_region: row.start_address_region,
    image_urls: row.image_urls ?? [],
    likes_count: row.likes_count ?? 0,
    is_round_trip: row.is_round_trip ?? false,
    created_at: row.created_at,
  };
}

function normalizeRouteRows(rows: RouteRow[] | null): Route[] {
  return (rows ?? []).map(toRoute).filter((route): route is Route => route !== null);
}

export async function getHomeRoutes(): Promise<Route[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('routes').select(ROUTE_SELECT).returns<RouteRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRouteRows(data);
}

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
