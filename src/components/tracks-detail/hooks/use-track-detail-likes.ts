'use client';

import { useMemo } from 'react';

import { useTrackLikes } from '@/commons/hooks/useTrackLikes';
import type { Track } from '@/commons/types/routerun';

export function useTrackDetailLikes(track: Track) {
  const trackLikeCounts = useMemo(
    () => ({ [track.id]: track.likes_count ?? 0 }),
    [track.id, track.likes_count],
  );
  return useTrackLikes(trackLikeCounts);
}
