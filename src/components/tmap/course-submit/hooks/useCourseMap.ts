'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import type {
  TmapCoordinate,
  TmapLatLngLike,
  TmapMapLike,
  TmapMarkerLike,
  TmapV3,
} from '@/commons/types/tmap';
import { getPedestrianRoute } from '@/repositories/map.repository';

const MAX_POINT_LENGTH = 7;

type MarkerRole = 'start' | 'via' | 'end';

export type SaveRoutePayload = {
  totalDistanceKm: number;
  pathData: {
    points: TmapCoordinate[];
    path: TmapCoordinate[];
  };
  startPoint: TmapCoordinate;
};

type UseCourseMapParams = {
  onSaveRoute?: (payload: SaveRoutePayload) => void;
};

function toCoordinate(latLng: TmapLatLngLike): TmapCoordinate | null {
  const lat =
    typeof latLng.lat === 'function'
      ? latLng.lat()
      : (latLng.lat ?? latLng._lat ?? latLng.latValue);
  const lng =
    typeof latLng.lng === 'function'
      ? latLng.lng()
      : (latLng.lng ?? latLng._lng ?? latLng.lngValue);
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

function extractLatLngFromVectorEvent(event: unknown): TmapLatLngLike | null {
  if (!event || typeof event !== 'object') return null;

  const eventObject = event as Record<string, unknown>;
  const candidates: unknown[] = [
    eventObject.lngLat,
    eventObject.latLng,
    eventObject._latLng,
    eventObject.fi,
    (eventObject.fi as Record<string, unknown> | undefined)?.lngLat,
    (eventObject.fi as Record<string, unknown> | undefined)?.latLng,
    (eventObject.fi as Record<string, unknown> | undefined)?._latLng,
    eventObject.Ai,
    (eventObject.Ai as Record<string, unknown> | undefined)?.lngLat,
    (eventObject.Ai as Record<string, unknown> | undefined)?.latLng,
    (eventObject.Ai as Record<string, unknown> | undefined)?._latLng,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const coordinate = toCoordinate(candidate as TmapLatLngLike);
    if (coordinate) return candidate as TmapLatLngLike;
  }

  return null;
}

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

export function useCourseMap({ onSaveRoute }: UseCourseMapParams = {}) {
  const [points, setPoints] = useState<TmapCoordinate[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mapRef = useRef<TmapMapLike | null>(null);
  const markerRefs = useRef<TmapMarkerLike[]>([]);
  const polylineRef = useRef<{ setMap: (map: TmapMapLike | null) => void } | null>(null);
  const isMapInitializedRef = useRef(false);
  const isClickListenerBoundRef = useRef(false);
  const lastClickSignatureRef = useRef<string | null>(null);

  const setMapInstance = useCallback((map: TmapMapLike) => {
    mapRef.current = map;
  }, []);

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
    [clearMarkers],
  );

  const clearPolyline = useCallback(() => {
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
  }, []);

  const initializeMap = useCallback(
    (mapElementId: string, center: TmapCoordinate) => {
      if (isMapInitializedRef.current) return;
      const Tmapv3 = window.Tmapv3 as TmapV3 | undefined;
      const mapElement = document.getElementById(mapElementId);
      if (!Tmapv3 || !mapElement) return;

      const map = new Tmapv3.Map(mapElementId, {
        center: new Tmapv3.LatLng(center.lat, center.lng),
        width: '100%',
        height: '100%',
        zoom: 15,
        scrollwheel: true,
        zoomControl: false,
        minZoom: 8,
      });
      setMapInstance(map);
      isMapInitializedRef.current = true;

      const clickListener = (event?: {
        lngLat?: TmapLatLngLike;
        latLng?: TmapLatLngLike;
        _latLng?: TmapLatLngLike;
      }) => {
        // eslint-disable-next-line no-console -- Tmap v3 click payload shape debugging
        console.log('Map Click Event:', event);
        const rawLatLng = extractLatLngFromVectorEvent(event);
        const nextCoordinate = rawLatLng ? toCoordinate(rawLatLng) : null;
        if (!nextCoordinate) return;

        const clickSignature = `${nextCoordinate.lat.toFixed(7)}:${nextCoordinate.lng.toFixed(7)}`;
        if (lastClickSignatureRef.current === clickSignature) return;
        lastClickSignatureRef.current = clickSignature;
        window.setTimeout(() => {
          if (lastClickSignatureRef.current === clickSignature) {
            lastClickSignatureRef.current = null;
          }
        }, 0);

        setErrorMessage(null);
        setPoints((prev) => {
          if (prev.length >= MAX_POINT_LENGTH) return prev;
          const nextPoints = [...prev, nextCoordinate];
          drawPointMarkers(nextPoints);
          return nextPoints;
        });
      };

      const clickListenerUnknown = clickListener as (event?: unknown) => void;

      const bindClickListener = () => {
        if (isClickListenerBoundRef.current) return;

        const mapLike = map as TmapMapLike & {
          on?: (eventName: string, callback: (event?: unknown) => void) => void;
          addListener?: (eventName: string, callback: (event?: unknown) => void) => void;
        };

        const tmapv3WithEvent = Tmapv3 as TmapV3 & {
          Event?: {
            addListener?: (
              target: object,
              eventName: string,
              callback: (event?: unknown) => void,
            ) => void;
          };
        };

        if (typeof mapLike.on === 'function') {
          mapLike.on('click', clickListenerUnknown);
          mapLike.on('Click', clickListenerUnknown);
          isClickListenerBoundRef.current = true;
          return;
        }

        if (typeof mapLike.addListener === 'function') {
          mapLike.addListener('click', clickListenerUnknown);
          mapLike.addListener('Click', clickListenerUnknown);
          isClickListenerBoundRef.current = true;
          return;
        }

        if (tmapv3WithEvent.Event?.addListener) {
          tmapv3WithEvent.Event.addListener(map as object, 'click', clickListenerUnknown);
          tmapv3WithEvent.Event.addListener(map as object, 'Click', clickListenerUnknown);
          isClickListenerBoundRef.current = true;
        }
      };

      const mapLikeWithLoad = map as TmapMapLike & {
        on?: (eventName: string, callback: () => void) => void;
      };

      if (typeof mapLikeWithLoad.on === 'function') {
        mapLikeWithLoad.on('load', bindClickListener);
      }

      bindClickListener();
    },
    [drawPointMarkers, setMapInstance],
  );

  const addPoint = useCallback(
    (latLng: TmapLatLngLike) => {
      setErrorMessage(null);
      const coordinate = toCoordinate(latLng);
      if (!coordinate) return;

      setPoints((prev) => {
        if (prev.length >= MAX_POINT_LENGTH) return prev;
        const nextPoints = [...prev, coordinate];
        drawPointMarkers(nextPoints);
        return nextPoints;
      });
    },
    [drawPointMarkers],
  );

  const undo = useCallback(() => {
    setErrorMessage(null);
    setPoints((prev) => {
      if (prev.length === 0) return prev;
      const nextPoints = prev.slice(0, -1);
      drawPointMarkers(nextPoints);
      return nextPoints;
    });
    setDistanceKm(null);
    clearPolyline();
  }, [clearPolyline, drawPointMarkers]);

  const reset = useCallback(() => {
    setPoints([]);
    setDistanceKm(null);
    setErrorMessage(null);
    clearMarkers();
    clearPolyline();
  }, [clearMarkers, clearPolyline]);

  const saveRoute = useCallback(async () => {
    if (points.length < 2) {
      setErrorMessage('출발지와 도착지를 포함해 최소 2개의 지점을 선택해 주세요.');
      return;
    }

    const Tmapv3 = window.Tmapv3 as TmapV3 | undefined;
    const map = mapRef.current;
    if (!Tmapv3 || !map) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await getPedestrianRoute(points);
      clearPolyline();

      const linePath = result.path.map((point) => new Tmapv3.LatLng(point.lat, point.lng));
      polylineRef.current = new Tmapv3.Polyline({
        path: linePath,
        strokeColor: '#2563EB',
        strokeWeight: 5,
        map,
      });

      const totalDistanceKm = Number((result.totalDistanceMeters / 1000).toFixed(2));
      setDistanceKm(totalDistanceKm);
      onSaveRoute?.({
        totalDistanceKm,
        pathData: {
          points,
          path: result.path,
        },
        startPoint: points[0],
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '경로 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [clearPolyline, onSaveRoute, points]);

  const isPointLimitReached = points.length >= MAX_POINT_LENGTH;
  const waypointCount = useMemo(() => Math.max(0, points.length - 2), [points.length]);

  return {
    points,
    distanceKm,
    isSaving,
    errorMessage,
    isPointLimitReached,
    waypointCount,
    setMapInstance,
    initializeMap,
    addPoint,
    undo,
    reset,
    saveRoute,
  };
}
