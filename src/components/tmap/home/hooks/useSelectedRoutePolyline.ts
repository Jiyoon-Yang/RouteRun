/**
 * 선택 코스 폴리라인의 로드/렌더/정리를 담당하는 훅.
 */

import { useCallback, useRef } from 'react';

import type { Route } from '@/commons/types/routerun';
import {
  dedupeConsecutiveCoordinates,
  extractPathCoordinates,
} from '@/commons/utils/route/path-parser';
import type { TmapMap, TmapPolyline, TmapV3API } from '@/commons/utils/tmap/types';

import type { MutableRefObject } from 'react';

const MOBILE_VIEWPORT_MAX_WIDTH_PX = 768;
const TABLET_VIEWPORT_MAX_WIDTH_PX = 1200;
const ROUTE_POLYLINE_FIT_PADDING_PROFILE = {
  mobile: { safeMarginPx: 16, bottomExtraMarginPx: 24 },
  tablet: { safeMarginPx: 20, bottomExtraMarginPx: 20 },
  desktop: { safeMarginPx: 24, bottomExtraMarginPx: 16 },
} as const;
const ROUTE_BOUNDS_INFLATE_RATIO = 1.42;
const ROUTE_BOUNDS_MIN_SPAN_LAT = 0.0088;
const ROUTE_BOUNDS_MIN_SPAN_LNG = 0.0112;
const ROUTE_POLYLINE_FIT_MAX_ZOOM_LEVEL = 15;

function padRouteBoundsForHomeFit(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  overlayRatio: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const cLat = (minLat + maxLat) / 2;
  const cLng = (minLng + maxLng) / 2;
  let latSpan = maxLat - minLat;
  let lngSpan = maxLng - minLng;
  latSpan = Math.max(latSpan * ROUTE_BOUNDS_INFLATE_RATIO, ROUTE_BOUNDS_MIN_SPAN_LAT);
  lngSpan = Math.max(lngSpan * ROUTE_BOUNDS_INFLATE_RATIO, ROUTE_BOUNDS_MIN_SPAN_LNG);
  const visibleLatSpanRatio = Math.max(0.28, 1 - overlayRatio);
  const mapLatSpan = latSpan / visibleLatSpanRatio;
  const shiftedCenterLat = cLat - (mapLatSpan * overlayRatio) / 2;
  return {
    minLat: shiftedCenterLat - mapLatSpan / 2,
    maxLat: shiftedCenterLat + mapLatSpan / 2,
    minLng: cLng - lngSpan / 2,
    maxLng: cLng + lngSpan / 2,
  };
}

function clampRoutePolylineFitZoom(map: TmapMap): void {
  const z = map.getZoom?.();
  if (typeof z !== 'number') return;
  if (z > ROUTE_POLYLINE_FIT_MAX_ZOOM_LEVEL) {
    map.setZoom(ROUTE_POLYLINE_FIT_MAX_ZOOM_LEVEL);
  }
}

function fitRouteInVisibleArea({
  map,
  Tmapv3,
  mapContainerId,
  bottomSheetVisibleHeight,
  minLat,
  maxLat,
  minLng,
  maxLng,
}: {
  map: TmapMap;
  Tmapv3: TmapV3API;
  mapContainerId: string;
  bottomSheetVisibleHeight: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): void {
  if (typeof map.fitBounds !== 'function') return;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const paddingProfile =
    viewportWidth <= MOBILE_VIEWPORT_MAX_WIDTH_PX
      ? ROUTE_POLYLINE_FIT_PADDING_PROFILE.mobile
      : viewportWidth <= TABLET_VIEWPORT_MAX_WIDTH_PX
        ? ROUTE_POLYLINE_FIT_PADDING_PROFILE.tablet
        : ROUTE_POLYLINE_FIT_PADDING_PROFILE.desktop;

  const LatLngBounds = (
    Tmapv3 as unknown as { LatLngBounds?: new (sw: unknown, ne: unknown) => unknown }
  ).LatLngBounds;

  const mapElement = document.getElementById(mapContainerId);
  const mapHeightPx = mapElement?.clientHeight ?? 0;
  const clampedOverlayPx = Math.min(Math.max(0, bottomSheetVisibleHeight), mapHeightPx);
  const overlayRatio =
    mapHeightPx > 0
      ? Math.min(0.72, (clampedOverlayPx + paddingProfile.bottomExtraMarginPx) / mapHeightPx)
      : 0;

  const padded = padRouteBoundsForHomeFit(minLat, maxLat, minLng, maxLng, overlayRatio);
  const southWest = new Tmapv3.LatLng(padded.minLat, padded.minLng);
  const northEast = new Tmapv3.LatLng(padded.maxLat, padded.maxLng);

  if (typeof LatLngBounds === 'function') {
    const bounds = new LatLngBounds(southWest, northEast);
    map.fitBounds(bounds);
    return;
  }
  map.fitBounds(southWest, northEast);
}

type UseSelectedRoutePolylineParams = {
  mapContainerId: string;
  routesRef: MutableRefObject<Route[]>;
  selectedRouteIdRef: MutableRefObject<string | null>;
  mapRef: MutableRefObject<TmapMap | null>;
  bottomSheetVisibleHeightRef: MutableRefObject<number>;
  getTmapv3: () => TmapV3API | undefined;
  clampHomeMapZoom: (map: TmapMap) => void;
};

export function useSelectedRoutePolyline({
  mapContainerId,
  routesRef,
  selectedRouteIdRef,
  mapRef,
  bottomSheetVisibleHeightRef,
  getTmapv3,
  clampHomeMapZoom,
}: UseSelectedRoutePolylineParams) {
  const selectedRoutePolylineRef = useRef<TmapPolyline | null>(null);
  const routePolylineGenerationRef = useRef(0);
  const selectedPolylineRetryTimerRef = useRef<number | null>(null);

  const clearSelectedRoutePolyline = useCallback(() => {
    routePolylineGenerationRef.current += 1;
    if (selectedPolylineRetryTimerRef.current !== null) {
      window.clearTimeout(selectedPolylineRetryTimerRef.current);
      selectedPolylineRetryTimerRef.current = null;
    }
    selectedRoutePolylineRef.current?.setMap(null);
    selectedRoutePolylineRef.current = null;
  }, []);

  const syncSelectedRoutePolyline = useCallback(
    (courseId: string | null, retryCount = 0) => {
      if (selectedPolylineRetryTimerRef.current !== null) {
        window.clearTimeout(selectedPolylineRetryTimerRef.current);
        selectedPolylineRetryTimerRef.current = null;
      }
      routePolylineGenerationRef.current += 1;
      const generation = routePolylineGenerationRef.current;

      if (!courseId) {
        selectedRoutePolylineRef.current?.setMap(null);
        selectedRoutePolylineRef.current = null;
        return;
      }

      const map = mapRef.current;
      const Tmapv3 = getTmapv3();
      if (!map || !Tmapv3) {
        if (retryCount < 2) {
          selectedPolylineRetryTimerRef.current = window.setTimeout(() => {
            selectedPolylineRetryTimerRef.current = null;
            if (selectedRouteIdRef.current !== courseId) return;
            syncSelectedRoutePolyline(courseId, retryCount + 1);
          }, 120);
        }
        return;
      }

      const route = routesRef.current.find((item) => item.id === courseId);
      if (!route) {
        if (retryCount < 2) {
          selectedPolylineRetryTimerRef.current = window.setTimeout(() => {
            selectedPolylineRetryTimerRef.current = null;
            if (selectedRouteIdRef.current !== courseId) return;
            syncSelectedRoutePolyline(courseId, retryCount + 1);
          }, 120);
        }
        return;
      }

      const lineCoordinates = dedupeConsecutiveCoordinates(
        extractPathCoordinates(route.path_data, route.id),
      );

      const isStale = (): boolean =>
        generation !== routePolylineGenerationRef.current ||
        selectedRouteIdRef.current !== courseId;

      if (isStale()) return;

      const liveMap = mapRef.current;
      const liveTmap = getTmapv3();
      if (lineCoordinates.length < 2) {
        selectedRoutePolylineRef.current?.setMap(null);
        selectedRoutePolylineRef.current = null;
        return;
      }
      if (!liveMap || !liveTmap) return;

      const latLngPath = lineCoordinates.map(
        (coordinate) => new liveTmap.LatLng(coordinate.lat, coordinate.lng),
      );
      const previousPolyline = selectedRoutePolylineRef.current;
      const nextPolyline = new liveTmap.Polyline({
        map: liveMap,
        path: latLngPath,
        strokeColor: '#2F80FF',
        strokeWeight: 6,
        strokeOpacity: 0.95,
      });
      selectedRoutePolylineRef.current = nextPolyline;
      previousPolyline?.setMap(null);

      if (typeof liveMap.fitBounds !== 'function') return;

      const latValues = lineCoordinates.map((c) => c.lat);
      const lngValues = lineCoordinates.map((c) => c.lng);
      const rawMinLat = Math.min(...latValues);
      const rawMaxLat = Math.max(...latValues);
      const rawMinLng = Math.min(...lngValues);
      const rawMaxLng = Math.max(...lngValues);
      fitRouteInVisibleArea({
        map: liveMap,
        Tmapv3: liveTmap,
        mapContainerId,
        bottomSheetVisibleHeight: bottomSheetVisibleHeightRef.current,
        minLat: rawMinLat,
        maxLat: rawMaxLat,
        minLng: rawMinLng,
        maxLng: rawMaxLng,
      });

      clampRoutePolylineFitZoom(liveMap);
      clampHomeMapZoom(liveMap);
    },
    [
      bottomSheetVisibleHeightRef,
      clampHomeMapZoom,
      getTmapv3,
      mapContainerId,
      mapRef,
      routesRef,
      selectedRouteIdRef,
    ],
  );

  return {
    syncSelectedRoutePolyline,
    clearSelectedRoutePolyline,
  };
}
