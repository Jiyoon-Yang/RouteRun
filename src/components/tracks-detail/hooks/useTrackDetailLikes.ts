'use client';

import { useMemo } from 'react';

import { toggleTrackLikeAction } from '@/actions/track.action';
import { useLikes } from '@/commons/hooks/useLikes';
import type { Track } from '@/commons/types/routerun';
import { fetchLikedTrackIds } from '@/services/track/trackLikeService';

const TRACK_LIKE_CONFIG = {
  entityLabel: '트랙',
  fetchLikedIds: fetchLikedTrackIds,
  toggleAction: toggleTrackLikeAction,
} as const;

export function useTrackDetailLikes(track: Track) {
  const trackLikeCounts = useMemo(
    () => ({ [track.id]: track.likes_count ?? 0 }),
    [track.id, track.likes_count],
  );
  const { isLiked, getLikeCount, toggleLike } = useLikes(trackLikeCounts, TRACK_LIKE_CONFIG);
  return {
    isTrackLiked: isLiked,
    getTrackLikeCount: getLikeCount,
    toggleTrackLike: toggleLike,
  };
}
