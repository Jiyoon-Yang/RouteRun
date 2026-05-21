// 홈 페이지 지도용 트랙 데이터 통신 전담 (클라이언트 Supabase 사용)
import type { RouteViewport, Track } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/client';

type TrackRow = {
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

const TRACK_SELECT =
  'id, user_id, title, description, distance_meters, start_lat, start_lng, start_address_region, image_urls, likes_count, created_at';

function toTrack(row: TrackRow): Track | null {
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
    start_address_region: row.start_address_region,
    image_urls: row.image_urls ?? [],
    likes_count: row.likes_count ?? 0,
    created_at: row.created_at,
  };
}

function normalizeTrackRows(rows: TrackRow[] | null): Track[] {
  return (rows ?? []).map(toTrack).filter((track): track is Track => track !== null);
}

export async function getHomeTracksByViewport(viewport: RouteViewport): Promise<Track[]> {
  const supabase = createClient();
  const minLat = Math.min(viewport.northEastLat, viewport.southWestLat);
  const maxLat = Math.max(viewport.northEastLat, viewport.southWestLat);
  const minLng = Math.min(viewport.northEastLng, viewport.southWestLng);
  const maxLng = Math.max(viewport.northEastLng, viewport.southWestLng);

  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .gte('start_lat', minLat)
    .lte('start_lat', maxLat)
    .gte('start_lng', minLng)
    .lte('start_lng', maxLng)
    .returns<TrackRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeTrackRows(data);
}
