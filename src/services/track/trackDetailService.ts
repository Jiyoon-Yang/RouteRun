import { cache } from 'react';

import type { Track } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/server';
import * as trackDetailRepository from '@/repositories/track/detail.repository';
import * as userRepository from '@/repositories/user.repository';
import { reverseGeocodeRegionForHome } from '@/services/map/mapService';

export type TrackDetailPayload = {
  track: Track;
  authorNickname: string;
  location: string;
};

export const fetchTrackDetail = cache(
  async (trackId: string): Promise<TrackDetailPayload | null> => {
    const supabase = createClient();

    const trackResult = await trackDetailRepository.getTrackById(supabase, trackId);
    if (trackResult.error) {
      console.error('[trackDetailService] 트랙 조회 실패:', trackResult.error);
      throw trackResult.error;
    }

    const track = trackResult.data;
    if (!track) return null;

    const locationFromDb = track.start_address_region ?? null;

    const [profileResult, location] = await Promise.all([
      userRepository.getUserProfileById(supabase, track.user_id),
      locationFromDb
        ? Promise.resolve(locationFromDb)
        : reverseGeocodeRegionForHome({ lat: track.start_lat, lng: track.start_lng }),
    ]);

    const authorNickname = profileResult.data?.nickname?.trim() || '작성자';
    return {
      track,
      authorNickname,
      location: location ?? '위치 정보 없음',
    };
  },
);
