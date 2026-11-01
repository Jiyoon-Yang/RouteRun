// 홈 페이지 지도용 트랙 데이터 통신 전담 (클라이언트 Supabase 사용)
import type { RouteViewport, Track } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/client';

import { TRACK_SELECT, normalizeTrackRows, type TrackRow } from './track-row';

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
