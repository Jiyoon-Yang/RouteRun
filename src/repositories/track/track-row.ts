import type { Track } from '@/commons/types/routerun';

export type TrackRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  distance_meters: number | null;
  start_lat: number | null;
  start_lng: number | null;
  start_address_region: string | null;
  image_urls: string[] | null;
  likes_count: number | null;
  created_at: string | null;
};

export const TRACK_SELECT =
  'id, user_id, title, description, distance_meters, start_lat, start_lng, start_address_region, image_urls, likes_count, created_at';

export function toTrack(row: TrackRow | null): Track | null {
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
    start_lat: row.start_lat,
    start_lng: row.start_lng,
    start_address_region: row.start_address_region ?? null,
    image_urls: row.image_urls ?? [],
    likes_count: row.likes_count ?? 0,
    created_at: row.created_at,
  };
}

export function normalizeTrackRows(rows: TrackRow[] | null): Track[] {
  return (rows ?? []).map(toTrack).filter((track): track is Track => track !== null);
}
