// 홈 페이지 지도용 코스 데이터 통신 전담
import type { Route } from '@/commons/types/runroute';
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
  image_urls: string[] | null;
  likes_count: number | null;
  created_at: string | null;
};

const ROUTE_SELECT =
  'id, user_id, title, description, distance_meters, path_data, start_lat, start_lng, image_urls, likes_count, created_at';

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
    image_urls: row.image_urls ?? [],
    likes_count: row.likes_count ?? 0,
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
