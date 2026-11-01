import type { Route } from '@/commons/types/routerun';

export type RouteRow = {
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

export const ROUTE_SELECT =
  'id, user_id, title, description, distance_meters, path_data, start_lat, start_lng, start_address_region, image_urls, likes_count, is_round_trip, created_at';

export function toRoute(row: RouteRow | null): Route | null {
  if (!row) return null;

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
    start_address_region: row.start_address_region ?? null,
    image_urls: row.image_urls ?? [],
    likes_count: row.likes_count ?? 0,
    is_round_trip: row.is_round_trip ?? false,
    created_at: row.created_at,
  };
}

export function normalizeRouteRows(rows: RouteRow[] | null): Route[] {
  return (rows ?? []).map(toRoute).filter((route): route is Route => route !== null);
}
