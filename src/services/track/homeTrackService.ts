import type { RouteViewport, Track } from '@/commons/types/routerun';
import { getHomeTracksByViewport } from '@/repositories/track/home.repository';

export async function fetchHomeTracks(viewport: RouteViewport): Promise<Track[]> {
  return getHomeTracksByViewport(viewport);
}
