'use client';

import { useEffect, useMemo, useRef } from 'react';

import type { Track } from '@/commons/types/routerun';
import type { TmapV3 } from '@/commons/types/tmap';
import { sanitizeDomIdSegment } from '@/commons/utils/route/path-parser';
import { getTmapv3Runtime } from '@/commons/utils/tmap/runtime';

import styles from './styles.module.css';

const TRACK_MARKER_ICON = '/assets/icons/courses-marker/marker_gray.png';

type TmapTrackDetailProps = {
  track: Track;
  mapLabel?: string;
};

type MapDetachableOverlay = {
  setMap: (map: unknown | null) => void;
};

export function TmapTrackDetail({ track, mapLabel }: TmapTrackDetailProps) {
  const mapContainerId = useMemo(
    () => `track-detail-map-${sanitizeDomIdSegment(track.id)}`,
    [track.id],
  );

  const mapRef = useRef<unknown | null>(null);
  const markerRef = useRef<MapDetachableOverlay | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;

    const tryMountMap = () => {
      if (cancelled) return;
      const rootElement = document.getElementById(mapContainerId);
      const Tmapv3 = getTmapv3Runtime() as TmapV3 | undefined;
      if (!rootElement || !Tmapv3) {
        pollTimer = window.setTimeout(tryMountMap, 120);
        return;
      }

      const mapInstance = new Tmapv3.Map(mapContainerId, {
        center: new Tmapv3.LatLng(track.start_lat, track.start_lng),
        width: '100%',
        height: '100%',
        zoom: 15,
        zoomControl: false,
        scrollwheel: false,
      });

      mapRef.current = mapInstance;

      const marker = new Tmapv3.Marker({
        position: new Tmapv3.LatLng(track.start_lat, track.start_lng),
        icon: TRACK_MARKER_ICON,
        map: mapInstance,
      }) as unknown as MapDetachableOverlay;

      markerRef.current = marker;
    };

    tryMountMap();

    return () => {
      cancelled = true;
      if (pollTimer !== null) window.clearTimeout(pollTimer);

      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch {
          /* no-op */
        }
        markerRef.current = null;
      }

      const mapInstance = mapRef.current as { destroy?: () => void } | null;
      if (mapInstance) {
        try {
          mapInstance.destroy?.();
        } catch {
          /* no-op */
        }
        mapRef.current = null;
      }
    };
  }, [mapContainerId, track.start_lat, track.start_lng]);

  return (
    <div className={styles.root}>
      <div id={mapContainerId} className={styles.map} aria-label={mapLabel} />
    </div>
  );
}

export default TmapTrackDetail;
