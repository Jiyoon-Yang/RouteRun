/**
 * 홈 Tmap의 초기 생성/위치 기반 시작/정리(cleanup)를 담당하는 훅.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { Route, RouteViewport } from '@/commons/types/runroute';
import { SEOUL_CITY_HALL_COORDINATE } from '@/commons/utils/geo';

import type { RouteMarkerEntry, TmapMap, TmapMarker, TmapMarkerCluster, TmapV3API } from '../types';

const DEFAULT_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 6000,
  maximumAge: 15000,
};

const PRECISE_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

const INITIAL_MAP_ZOOM_LEVEL = 14;

type UseHomeMapLifecycleParams = {
  mapContainerId: string;
  initialViewport: RouteViewport | null;
  routesRef: RefObject<Route[]>;
  mapRef: RefObject<TmapMap | null>;
  currentLocationMarkerRef: RefObject<TmapMarker | null>;
  currentLocationCoordinateRef: RefObject<{ lat: number; lng: number } | null>;
  routeMarkerMapRef: RefObject<Map<string, RouteMarkerEntry>>;
  routeMarkerClusterRef: RefObject<TmapMarkerCluster | null>;
  mapListenersRegisteredRef: RefObject<boolean>;
  isMapInteractingRef: RefObject<boolean>;
  interactionWatchdogTimerRef: RefObject<number | null>;
  viewportSyncIntervalRef: RefObject<number | null>;
  zoomUpdateRafRef: RefObject<number | null>;
  markerVisibilityTimerRef: RefObject<number | null>;
  selectedRouteIdRef: RefObject<string | null>;
  markerHoverCountRef: RefObject<number>;
  lastAppliedZoomRef: RefObject<number | null>;
  clearSelectedRoutePolyline: () => void;
  clearViewportReporterState: () => void;
  clearZoomControlState: () => void;
  getTmapv3: () => TmapV3API | undefined;
  minZoomLevel: number;
  maxZoomLevel: number;
  clampHomeMapZoom: (map: TmapMap) => void;
  createCustomMarker: (map: TmapMap, lat: number, lng: number) => void;
  centerMapToLocationInVisibleArea: (map: TmapMap, lat: number, lng: number) => void;
  applyInitialViewport: (map: TmapMap) => void;
  enforceMinZoomLevel: (map: TmapMap) => number | null;
  registerMapListeners: (map: TmapMap) => void;
  scheduleViewportReport: (map: TmapMap, delay?: number) => void;
  scheduleMarkerVisibilitySync: (map: TmapMap) => void;
  emitViewportReports: (map: TmapMap) => void;
  syncRouteMarkers: (map: TmapMap, nextRoutes: Route[]) => void;
};

export function useHomeMapLifecycle({
  mapContainerId,
  initialViewport,
  routesRef,
  mapRef,
  currentLocationMarkerRef,
  currentLocationCoordinateRef,
  routeMarkerMapRef,
  routeMarkerClusterRef,
  mapListenersRegisteredRef,
  isMapInteractingRef,
  interactionWatchdogTimerRef,
  viewportSyncIntervalRef,
  zoomUpdateRafRef,
  markerVisibilityTimerRef,
  selectedRouteIdRef,
  markerHoverCountRef,
  lastAppliedZoomRef,
  clearSelectedRoutePolyline,
  clearViewportReporterState,
  clearZoomControlState,
  getTmapv3,
  minZoomLevel,
  maxZoomLevel,
  clampHomeMapZoom,
  createCustomMarker,
  centerMapToLocationInVisibleArea,
  applyInitialViewport,
  enforceMinZoomLevel,
  registerMapListeners,
  scheduleViewportReport,
  scheduleMarkerVisibilitySync,
  emitViewportReports,
  syncRouteMarkers,
}: UseHomeMapLifecycleParams) {
  const [mapReadyToken, setMapReadyToken] = useState(0);
  const hasAppliedInitialViewportRef = useRef(false);

  const handleRefreshLocation = useCallback(() => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        centerMapToLocationInVisibleArea(map, latitude, longitude);
        createCustomMarker(map, latitude, longitude);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('위치 갱신 실패:', error);
        alert('위치 정보를 가져올 수 없습니다.');
      },
      PRECISE_GEOLOCATION_OPTIONS,
    );
  }, [centerMapToLocationInVisibleArea, createCustomMarker, mapRef]);

  useEffect(() => {
    let cancelled = false;

    const initTmap = (lat: number, lng: number) => {
      if (cancelled) return;
      const Tmapv3 = getTmapv3();
      if (!Tmapv3 || mapRef.current) return;

      const map = new Tmapv3.Map(mapContainerId, {
        center: new Tmapv3.LatLng(lat, lng),
        width: '100%',
        height: '100%',
        zoom: INITIAL_MAP_ZOOM_LEVEL,
        minZoom: minZoomLevel,
        zoomControl: false,
        scrollwheel: false,
      });

      map.setZoomLimit?.(minZoomLevel, maxZoomLevel);
      lastAppliedZoomRef.current = map.getZoom();
      createCustomMarker(map, lat, lng);
      mapRef.current = map;
      setMapReadyToken((previous) => previous + 1);

      if (!initialViewport) {
        centerMapToLocationInVisibleArea(map, lat, lng);
      }

      // 초기 viewport는 최초 1회만 적용한다.
      if (!hasAppliedInitialViewportRef.current) {
        applyInitialViewport(map);
        hasAppliedInitialViewportRef.current = true;
      }

      enforceMinZoomLevel(map);
      registerMapListeners(map);
      scheduleViewportReport(map, 500);

      if (viewportSyncIntervalRef.current !== null) {
        window.clearInterval(viewportSyncIntervalRef.current);
      }
      viewportSyncIntervalRef.current = window.setInterval(() => {
        if (!isMapInteractingRef.current) {
          scheduleMarkerVisibilitySync(map);
        }
        emitViewportReports(map);
      }, 450);

      syncRouteMarkers(map, routesRef.current);
    };

    const startWithLocation = () => {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            initTmap(position.coords.latitude, position.coords.longitude);
          },
          () => {
            initTmap(SEOUL_CITY_HALL_COORDINATE.lat, SEOUL_CITY_HALL_COORDINATE.lng);
          },
          DEFAULT_GEOLOCATION_OPTIONS,
        );
      } else {
        initTmap(SEOUL_CITY_HALL_COORDINATE.lat, SEOUL_CITY_HALL_COORDINATE.lng);
      }
    };

    const checkLibrary = () => {
      if (getTmapv3()) {
        startWithLocation();
      } else {
        window.setTimeout(checkLibrary, 100);
      }
    };

    checkLibrary();

    const routeMarkerMap = routeMarkerMapRef.current;
    return () => {
      cancelled = true;

      const clusterOnUnmount = routeMarkerClusterRef.current;
      if (clusterOnUnmount && typeof clusterOnUnmount.clearMarkers === 'function') {
        try {
          clusterOnUnmount.clearMarkers();
        } catch {
          /* noop */
        }
      }
      clusterOnUnmount?.setMap?.(null);
      routeMarkerClusterRef.current = null;

      routeMarkerMap.forEach((entry) => {
        entry.marker.setMap(null);
      });
      routeMarkerMap.clear();

      clearSelectedRoutePolyline();
      mapRef.current = null;
      currentLocationMarkerRef.current = null;
      currentLocationCoordinateRef.current = null;
      selectedRouteIdRef.current = null;
      markerHoverCountRef.current = 0;
      mapListenersRegisteredRef.current = false;
      isMapInteractingRef.current = false;

      if (interactionWatchdogTimerRef.current !== null) {
        window.clearTimeout(interactionWatchdogTimerRef.current);
        interactionWatchdogTimerRef.current = null;
      }
      if (viewportSyncIntervalRef.current !== null) {
        window.clearInterval(viewportSyncIntervalRef.current);
        viewportSyncIntervalRef.current = null;
      }
      clearZoomControlState();
      if (zoomUpdateRafRef.current !== null) {
        window.cancelAnimationFrame(zoomUpdateRafRef.current);
        zoomUpdateRafRef.current = null;
      }
      if (markerVisibilityTimerRef.current !== null) {
        window.clearTimeout(markerVisibilityTimerRef.current);
        markerVisibilityTimerRef.current = null;
      }
      lastAppliedZoomRef.current = null;
      clearViewportReporterState();
    };
  }, [
    applyInitialViewport,
    centerMapToLocationInVisibleArea,
    clearSelectedRoutePolyline,
    clearViewportReporterState,
    clearZoomControlState,
    createCustomMarker,
    emitViewportReports,
    enforceMinZoomLevel,
    getTmapv3,
    initialViewport,
    isMapInteractingRef,
    interactionWatchdogTimerRef,
    lastAppliedZoomRef,
    mapContainerId,
    mapListenersRegisteredRef,
    mapRef,
    markerHoverCountRef,
    markerVisibilityTimerRef,
    maxZoomLevel,
    minZoomLevel,
    registerMapListeners,
    routeMarkerClusterRef,
    routeMarkerMapRef,
    routesRef,
    scheduleMarkerVisibilitySync,
    scheduleViewportReport,
    selectedRouteIdRef,
    syncRouteMarkers,
    viewportSyncIntervalRef,
    zoomUpdateRafRef,
    currentLocationMarkerRef,
    currentLocationCoordinateRef,
  ]);

  useEffect(() => {
    hasAppliedInitialViewportRef.current = false;
  }, [initialViewport]);

  return {
    mapReadyToken,
    handleRefreshLocation,
  };
}
