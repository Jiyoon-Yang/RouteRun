import { useCallback, useRef } from 'react';

import type { TmapCoordinate, TmapMapLike, TmapMarkerLike, TmapV3 } from '@/commons/types/tmap';
import {
  buildWaypointMarkerIconUrl,
  getWaypointMarkerTitle,
  WAYPOINT_MARKER_ICON_SIZE,
} from '@/components/tmap/shared/build-waypoint-marker-icon';

import type { RefObject } from 'react';

type MarkerRole = 'start' | 'via' | 'end';

export function useTmapOverlays(mapRef: RefObject<TmapMapLike | null>) {
  const markerRefs = useRef<TmapMarkerLike[]>([]);
  const polylineRef = useRef<{ setMap: (map: TmapMapLike | null) => void } | null>(null);

  const clearMarkers = useCallback(() => {
    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];
  }, []);

  const drawPointMarkers = useCallback(
    (nextPoints: TmapCoordinate[]) => {
      const Tmapv3 = window.Tmapv3 as TmapV3 | undefined;
      const map = mapRef.current;
      if (!Tmapv3 || !map) return;

      clearMarkers();

      nextPoints.forEach((point, index) => {
        const isStart = index === 0;
        const isEnd = nextPoints.length >= 2 && index === nextPoints.length - 1;
        const role: MarkerRole = isStart ? 'start' : isEnd ? 'end' : 'via';
        const label = isStart ? 'S' : isEnd ? 'E' : String(index);

        const marker = new Tmapv3.Marker({
          position: new Tmapv3.LatLng(point.lat, point.lng),
          map,
          title: getWaypointMarkerTitle(role),
          icon: buildWaypointMarkerIconUrl(role, label),
          iconSize: new Tmapv3.Size(WAYPOINT_MARKER_ICON_SIZE.width, WAYPOINT_MARKER_ICON_SIZE.height),
        });
        markerRefs.current.push(marker);
      });
    },
    [clearMarkers, mapRef],
  );

  const clearPolyline = useCallback(() => {
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
  }, []);

  const drawRoutePolyline = useCallback(
    (path: TmapCoordinate[]) => {
      const Tmapv3 = window.Tmapv3 as TmapV3 | undefined;
      const map = mapRef.current;
      if (!Tmapv3 || !map) return;

      clearPolyline();

      const linePath = path.map((point) => new Tmapv3.LatLng(point.lat, point.lng));
      polylineRef.current = new Tmapv3.Polyline({
        path: linePath,
        strokeColor: '#2563EB',
        strokeWeight: 5,
        map,
      });
    },
    [clearPolyline, mapRef],
  );

  return {
    clearMarkers,
    drawPointMarkers,
    clearPolyline,
    drawRoutePolyline,
  };
}
