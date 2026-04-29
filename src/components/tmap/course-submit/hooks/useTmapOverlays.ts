import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';

import type { TmapCoordinate, TmapMapLike, TmapMarkerLike, TmapV3 } from '@/commons/types/tmap';

type MarkerRole = 'start' | 'via' | 'end';

function markerTitleByRole(role: MarkerRole): string {
  if (role === 'start') return '출발지';
  if (role === 'end') return '도착지';
  return '경유지';
}

function markerColorByRole(role: MarkerRole): string {
  if (role === 'start') return '#16A34A';
  if (role === 'end') return '#DC2626';
  return '#2563EB';
}

function markerIcon(role: MarkerRole, label: string): string {
  const color = markerColorByRole(role);
  const textColor = '#FFFFFF';
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
  <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 27 17 27s17-14.25 17-27C34 7.611 26.389 0 17 0z" fill="${color}"/>
  <text x="17" y="21" text-anchor="middle" font-size="12" font-weight="700" fill="${textColor}" font-family="Arial, sans-serif">${label}</text>
</svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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
          title: markerTitleByRole(role),
          icon: markerIcon(role, label),
          iconSize: new Tmapv3.Size(34, 44),
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
