'use client';

import { useEffect, useState } from 'react';

import type { Track, RouteViewport } from '@/commons/types/routerun';
import { fetchHomeTracks } from '@/services/track/homeTrackService';

export function useTracks(viewport: RouteViewport | null) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!viewport) {
      setTracks([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchHomeTracks(viewport)
      .then((result) => {
        if (cancelled) return;
        setTracks(result);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('[useTracks] 트랙 조회 실패:', error);
        setTracks([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewport]);

  return { tracks, isLoading };
}
