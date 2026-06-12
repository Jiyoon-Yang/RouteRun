/**
 * 홈 지도의 코스 마커/클러스터/선택 상태 동기화를 담당하는 훅.
 */

import { useCallback, useEffect, useRef } from 'react';

import type { Route } from '@/commons/types/routerun';
import { getDistanceCategory, type DistanceCategory } from '@/commons/utils/distance/category';
import {
  getRunningCourseMarkerIconUrlForCategory,
  type MarkerVisualState,
} from '@/commons/utils/marker/route-marker';
import { resolveRouteStartForMapMarker } from '@/commons/utils/marker/route-marker-position';
import { bindTmapMarkerListener } from '@/commons/utils/tmap/events';
import type {
  RouteMarkerEntry,
  TmapLatLng,
  TmapMap,
  TmapMarker,
  TmapMarkerCluster,
  TmapV3API,
} from '@/commons/utils/tmap/types';
import { applyPointerCursorToTmapMarker } from '@/components/tmap/commons/utils/apply-pointer-cursor-to-tmap-marker';

import { syncRouteMarkerDomVisualState } from '../sync-route-marker-dom-visual';

import type { MutableRefObject } from 'react';

const ROUTE_MARKER_CLUSTER_ZOOM_AT_OR_BELOW = 11;
const ROUTE_MARKER_INDIVIDUAL_ZOOM_AT_OR_ABOVE = ROUTE_MARKER_CLUSTER_ZOOM_AT_OR_BELOW + 1;
const MARKER_VISIBILITY_DEBOUNCE_MS = 140;

type UseRouteMarkersParams = {
  mapRootRef?: MutableRefObject<HTMLDivElement | null>;
  mapRef: MutableRefObject<TmapMap | null>;
  routesRef: MutableRefObject<Route[]>;
  routeMarkerMapRef: MutableRefObject<Map<string, RouteMarkerEntry>>;
  routeMarkerClusterRef: MutableRefObject<TmapMarkerCluster | null>;
  routeMarkerClusterGenerationRef: MutableRefObject<number>;
  routesSyncSigRef: MutableRefObject<string | null>;
  selectedRouteIdRef: MutableRefObject<string | null>;
  markerVisibilityTimerRef: MutableRefObject<number | null>;
  trackMarkersRef: MutableRefObject<TmapMarker[]>;
  getTmapv3: () => TmapV3API | undefined;
  tryReadMarkerAttachedMap: (marker: unknown) => unknown;
  tryReadSdkLatLngFromMarker: (marker: TmapMarker) => { lat: number; lng: number } | null;
  roundCoordForLog: (n: number) => number;
  isMarkerCoordDebugEnabled: () => boolean;
  isMarkerLifecycleDebugEnabled: () => boolean;
  bottomSheetVisibleHeightRef: MutableRefObject<number>;
  onCourseMarkerClick?: (courseId: string, route: Route) => void;
  setMarkerHoverCursor: (isHover: boolean) => void;
  syncSelectedRoutePolyline: (courseId: string | null) => void;
  clearSelectedRoutePolyline: () => void;
};

function buildRoutesSyncSignature(routes: Route[]): string {
  return routes
    .map(
      (r) => `${r.id}:${String(r.start_lat)}:${String(r.start_lng)}:${String(r.distance_meters)}`,
    )
    .sort()
    .join('|');
}

function getRouteDistanceCategory(route: Route): DistanceCategory {
  if (!Number.isFinite(route.distance_meters) || route.distance_meters < 0) {
    return 'BETWEEN_3_AND_5';
  }
  return getDistanceCategory(route.distance_meters);
}

export function useRouteMarkers({
  mapRootRef,
  mapRef,
  routesRef,
  routeMarkerMapRef,
  routeMarkerClusterRef,
  routeMarkerClusterGenerationRef,
  routesSyncSigRef,
  selectedRouteIdRef,
  markerVisibilityTimerRef,
  trackMarkersRef,
  getTmapv3,
  tryReadMarkerAttachedMap,
  tryReadSdkLatLngFromMarker,
  roundCoordForLog,
  isMarkerCoordDebugEnabled,
  isMarkerLifecycleDebugEnabled,
  bottomSheetVisibleHeightRef,
  onCourseMarkerClick,
  setMarkerHoverCursor,
  syncSelectedRoutePolyline,
  clearSelectedRoutePolyline,
}: UseRouteMarkersParams) {
  const routeMarkerRouteDisplayModeRef = useRef<'cluster' | 'individual'>('individual');
  const routeMarkerClusterAttachGenerationRef = useRef(-1);
  const routeVisualStateHandlerRef = useRef<(courseId: string, state: MarkerVisualState) => void>(
    () => undefined,
  );
  const selectedMarkerVisualHandlerRef = useRef<
    (courseId: string | null, shouldFocusSelectedCourse: boolean) => void
  >(() => {});
  const routeMarkerOverlaySignatureRef = useRef('');
  const lastMarkerClickAtRef = useRef<{ routeId: string; at: number } | null>(null);

  const isTmapRouteMarkerClusterLoaded = useCallback((): boolean => {
    return typeof getTmapv3()?.extension?.MarkerCluster === 'function';
  }, [getTmapv3]);

  const logMarkerCoordinateAudit = useCallback(
    (map: TmapMap, phase: string) => {
      if (!isMarkerCoordDebugEnabled()) return;
      const zoom = typeof map.getZoom === 'function' ? map.getZoom() : Number.NaN;
      const selectedId = selectedRouteIdRef.current;
      const rows: Array<Record<string, string | number | boolean | null>> = [];
      let mismatch = 0;
      let noSdkReader = 0;

      routeMarkerMapRef.current.forEach((entry, routeId) => {
        const sdk = tryReadSdkLatLngFromMarker(entry.marker);
        if (!sdk) noSdkReader += 1;
        const dLat = sdk ? sdk.lat - entry.lat : null;
        const dLng = sdk ? sdk.lng - entry.lng : null;
        const coordsOk =
          sdk !== null &&
          dLat !== null &&
          dLng !== null &&
          Math.abs(dLat) < 1e-9 &&
          Math.abs(dLng) < 1e-9;
        if (!coordsOk) mismatch += 1;
        rows.push({
          routeId: `${routeId.slice(0, 10)}…`,
          sel: routeId === selectedId,
          visible: entry.isVisible,
          storedLat: roundCoordForLog(entry.lat),
          storedLng: roundCoordForLog(entry.lng),
          sdkLat: sdk ? roundCoordForLog(sdk.lat) : null,
          sdkLng: sdk ? roundCoordForLog(sdk.lng) : null,
          dLat: dLat !== null ? roundCoordForLog(dLat) : null,
          dLng: dLng !== null ? roundCoordForLog(dLng) : null,
        });
      });
    },
    [
      isMarkerCoordDebugEnabled,
      routeMarkerMapRef,
      roundCoordForLog,
      selectedRouteIdRef,
      tryReadSdkLatLngFromMarker,
    ],
  );

  const logRouteMarkerAttachSnapshot = useCallback(
    (map: TmapMap | null, phase: string) => {
      if (!isMarkerLifecycleDebugEnabled()) return;
      const targetMap = map ?? mapRef.current;
      let routeMarkersAttachedToMap = 0;
      const sample: Record<string, unknown>[] = [];
      routeMarkerMapRef.current.forEach((entry, routeId) => {
        const sdkMap = tryReadMarkerAttachedMap(entry.marker);
        const markerOnTarget = sdkMap != null && sdkMap === targetMap;
        if (markerOnTarget) routeMarkersAttachedToMap += 1;

        let iconProbe: boolean | string = 'no-element';
        const el = entry.marker.getElement?.();
        if (el instanceof HTMLElement) {
          const img = el.querySelector('img');
          iconProbe = img ? img.complete && img.naturalHeight > 0 : 'no-img';
        }

        if (sample.length < 8) {
          sample.push({
            id: `${routeId.slice(0, 10)}…`,
            entryVisible: entry.isVisible,
            markerOnTargetMap: markerOnTarget,
            getMapOrMap: sdkMap != null,
            iconOk: iconProbe,
          });
        }
      });

      const cluster = routeMarkerClusterRef.current as unknown as {
        getMarkers?: () => unknown[];
        markers?: unknown[];
      } | null;
      let clusterMarkerCount: number | null = null;
      if (cluster && typeof cluster.getMarkers === 'function') {
        try {
          clusterMarkerCount = cluster.getMarkers()?.length ?? null;
        } catch {
          clusterMarkerCount = null;
        }
      } else if (cluster && Array.isArray(cluster.markers)) {
        clusterMarkerCount = cluster.markers.length;
      }
    },
    [
      bottomSheetVisibleHeightRef,
      isMarkerLifecycleDebugEnabled,
      mapRef,
      routeMarkerClusterRef,
      routeMarkerMapRef,
      tryReadMarkerAttachedMap,
    ],
  );

  const tearDownRouteMarkerCluster = useCallback(() => {
    const cluster = routeMarkerClusterRef.current;
    if (!cluster) return;
    const clusterLoose = cluster as unknown as {
      clearMarkers?: () => void;
      setMap?: (m: unknown) => void;
      removeMarkers?: () => void;
    };
    if (typeof clusterLoose.clearMarkers === 'function') {
      try {
        clusterLoose.clearMarkers();
      } catch {
        /* noop */
      }
    }
    if (typeof clusterLoose.removeMarkers === 'function') {
      try {
        clusterLoose.removeMarkers();
      } catch {
        /* noop */
      }
    }
    cluster.setMap?.(null);
    routeMarkerClusterRef.current = null;
  }, [routeMarkerClusterRef]);

  const syncRouteMarkersDisplayForZoom = useCallback(
    (map: TmapMap) => {
      const markerCount = routeMarkerMapRef.current.size;
      if (!isTmapRouteMarkerClusterLoaded()) {
        tearDownRouteMarkerCluster();
        routeMarkerRouteDisplayModeRef.current = 'individual';
        routeMarkerClusterAttachGenerationRef.current = -1;
        routeMarkerOverlaySignatureRef.current = '';
        routeMarkerMapRef.current.forEach((entry) => {
          entry.marker.setMap(map);
          entry.isVisible = true;
          entry.outOfViewportSinceMs = null;
        });
        trackMarkersRef.current.forEach((m) => m.setMap(map));
        return;
      }

      const rawZoom = map.getZoom();
      if (typeof rawZoom !== 'number' || Number.isNaN(rawZoom)) {
        routeMarkerMapRef.current.forEach((entry) => {
          entry.marker.setMap(map);
          entry.isVisible = true;
        });
        trackMarkersRef.current.forEach((m) => m.setMap(map));
        return;
      }

      if (markerCount === 0 && trackMarkersRef.current.length === 0) {
        tearDownRouteMarkerCluster();
        routeMarkerRouteDisplayModeRef.current = 'individual';
        routeMarkerClusterAttachGenerationRef.current = -1;
        routeMarkerOverlaySignatureRef.current = '';
        return;
      }

      const wantClusterMode = rawZoom <= ROUTE_MARKER_CLUSTER_ZOOM_AT_OR_BELOW;
      const wantIndividualMode = rawZoom >= ROUTE_MARKER_INDIVIDUAL_ZOOM_AT_OR_ABOVE;

      if (wantIndividualMode) {
        tearDownRouteMarkerCluster();
        routeMarkerRouteDisplayModeRef.current = 'individual';
        routeMarkerClusterAttachGenerationRef.current = -1;
        routeMarkerOverlaySignatureRef.current = '';
        routeMarkerMapRef.current.forEach((entry) => {
          entry.marker.setMap(map);
          entry.isVisible = true;
          entry.outOfViewportSinceMs = null;
        });
        trackMarkersRef.current.forEach((m) => m.setMap(map));
        return;
      }

      if (!wantClusterMode) return;

      const gen = routeMarkerClusterGenerationRef.current;
      const prevMode = routeMarkerRouteDisplayModeRef.current;
      const needsRebuild =
        prevMode !== 'cluster' ||
        !routeMarkerClusterRef.current ||
        gen !== routeMarkerClusterAttachGenerationRef.current;

      if (needsRebuild) {
        tearDownRouteMarkerCluster();
        routeMarkerMapRef.current.forEach((entry) => {
          entry.marker.setMap(null);
          entry.isVisible = true;
          entry.outOfViewportSinceMs = null;
        });
        trackMarkersRef.current.forEach((m) => m.setMap(null));
        const MarkerCluster = getTmapv3()?.extension?.MarkerCluster;
        if (!MarkerCluster) {
          routeMarkerRouteDisplayModeRef.current = 'individual';
          routeMarkerClusterAttachGenerationRef.current = -1;
          routeMarkerMapRef.current.forEach((entry) => entry.marker.setMap(map));
          trackMarkersRef.current.forEach((m) => m.setMap(map));
          return;
        }
        const markers = [
          ...Array.from(routeMarkerMapRef.current.values(), (e) => e.marker),
          ...trackMarkersRef.current,
        ];
        if (markers.length > 0) {
          try {
            routeMarkerClusterRef.current = new MarkerCluster({ markers, map });
            routeMarkerClusterAttachGenerationRef.current = gen;
          } catch {
            routeMarkerClusterRef.current = null;
            routeMarkerRouteDisplayModeRef.current = 'individual';
            routeMarkerClusterAttachGenerationRef.current = -1;
            routeMarkerMapRef.current.forEach((entry) => entry.marker.setMap(map));
            trackMarkersRef.current.forEach((m) => m.setMap(map));
            return;
          }
        }
      }
      routeMarkerRouteDisplayModeRef.current = 'cluster';
    },
    [
      getTmapv3,
      isTmapRouteMarkerClusterLoaded,
      routeMarkerClusterGenerationRef,
      routeMarkerClusterRef,
      routeMarkerMapRef,
      tearDownRouteMarkerCluster,
      trackMarkersRef,
    ],
  );

  const syncMarkerVisibilityByViewport = useCallback(
    (map: TmapMap) => {
      syncRouteMarkersDisplayForZoom(map);
      logRouteMarkerAttachSnapshot(map, 'after syncRouteMarkersDisplayForZoom');
    },
    [logRouteMarkerAttachSnapshot, syncRouteMarkersDisplayForZoom],
  );

  const scheduleMarkerVisibilitySync = useCallback(
    (map: TmapMap) => {
      if (markerVisibilityTimerRef.current !== null) {
        window.clearTimeout(markerVisibilityTimerRef.current);
      }
      markerVisibilityTimerRef.current = window.setTimeout(() => {
        markerVisibilityTimerRef.current = null;
        syncMarkerVisibilityByViewport(map);
      }, MARKER_VISIBILITY_DEBOUNCE_MS);
    },
    [markerVisibilityTimerRef, syncMarkerVisibilityByViewport],
  );

  const handleRouteMarkerClick = useCallback(
    (routeId: string) => {
      const now = Date.now();
      const last = lastMarkerClickAtRef.current;
      if (last?.routeId === routeId && now - last.at < 350) return;
      lastMarkerClickAtRef.current = { routeId, at: now };

      const route = routesRef.current.find((item) => item.id === routeId);
      if (!route) return;
      onCourseMarkerClick?.(routeId, route);
    },
    [onCourseMarkerClick, routesRef],
  );

  // SDK click이 안 오는 런타임용 — map_div 밖 오버레이·캡처 간섭 시에도 동작
  useEffect(() => {
    const root = mapRootRef?.current;
    if (!root || !onCourseMarkerClick) return undefined;

    const handleDelegatedClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('button')) return;

      const markerHost = target.closest('[data-route-marker-id]');
      if (!markerHost) return;
      const routeId = markerHost.getAttribute('data-route-marker-id');
      if (!routeId) return;

      event.stopPropagation();
      handleRouteMarkerClick(routeId);
    };

    root.addEventListener('click', handleDelegatedClick, true);
    return () => {
      root.removeEventListener('click', handleDelegatedClick, true);
    };
  }, [handleRouteMarkerClick, mapRootRef, onCourseMarkerClick]);

  const addMarkerListener = useCallback(
    (marker: TmapMarker, eventName: 'click' | 'mouseover' | 'mouseout', callback: () => void) => {
      bindTmapMarkerListener(marker, getTmapv3, eventName, callback);
    },
    [getTmapv3],
  );

  const bindMarkerDomClickFallback = useCallback(
    (marker: TmapMarker, routeId: string) => {
      const bind = (): void => {
        const rootElement = marker.getElement?.();
        if (!(rootElement instanceof HTMLElement)) return;

        rootElement.setAttribute('data-route-marker-id', routeId);
        if (rootElement.dataset.routeMarkerClickBound === '1') return;
        rootElement.dataset.routeMarkerClickBound = '1';

        rootElement.addEventListener(
          'click',
          (event) => {
            event.stopPropagation();
            handleRouteMarkerClick(routeId);
          },
          true,
        );
      };

      bind();
      window.requestAnimationFrame(bind);
    },
    [handleRouteMarkerClick],
  );

  const bindMarkerDomHoverFallback = useCallback(
    (marker: TmapMarker, routeId: string) => {
      const rootElement = marker.getElement?.();
      if (!(rootElement instanceof HTMLElement)) return;
      rootElement.addEventListener('mouseenter', () => {
        setMarkerHoverCursor(true);
        if (selectedRouteIdRef.current === routeId) return;
        routeVisualStateHandlerRef.current(routeId, 'hover');
      });
      rootElement.addEventListener('mouseleave', () => {
        setMarkerHoverCursor(false);
        if (selectedRouteIdRef.current === routeId) return;
        routeVisualStateHandlerRef.current(routeId, 'default');
      });
    },
    [selectedRouteIdRef, setMarkerHoverCursor],
  );

  const createRouteMarker = useCallback(
    (
      map: TmapMap | null,
      route: Route,
      category: DistanceCategory,
      visualState: MarkerVisualState,
    ): TmapMarker | null => {
      const Tmapv3 = getTmapv3();
      const routeStart = resolveRouteStartForMapMarker(route);
      if (!Tmapv3 || !routeStart) return null;
      const markerOptions: Record<string, unknown> = {
        position: new Tmapv3.LatLng(routeStart.lat, routeStart.lng),
        icon: getRunningCourseMarkerIconUrlForCategory(category, visualState),
      };
      if (map !== null) markerOptions.map = map;
      const routeMarker = new Tmapv3.Marker(markerOptions) as TmapMarker;
      applyPointerCursorToTmapMarker(routeMarker);
      return routeMarker;
    },
    [getTmapv3],
  );

  const attachRouteMarkerListeners = useCallback(
    (marker: TmapMarker, routeId: string) => {
      addMarkerListener(marker, 'mouseover', () => {
        setMarkerHoverCursor(true);
        if (selectedRouteIdRef.current === routeId) return;
        routeVisualStateHandlerRef.current(routeId, 'hover');
      });
      addMarkerListener(marker, 'mouseout', () => {
        setMarkerHoverCursor(false);
        if (selectedRouteIdRef.current === routeId) return;
        routeVisualStateHandlerRef.current(routeId, 'default');
      });
      addMarkerListener(marker, 'click', () => {
        handleRouteMarkerClick(routeId);
      });
      bindMarkerDomClickFallback(marker, routeId);
      bindMarkerDomHoverFallback(marker, routeId);
    },
    [
      addMarkerListener,
      bindMarkerDomClickFallback,
      bindMarkerDomHoverFallback,
      handleRouteMarkerClick,
      selectedRouteIdRef,
      setMarkerHoverCursor,
    ],
  );

  const setRouteMarkerVisualState = useCallback(
    (courseId: string, state: MarkerVisualState) => {
      const markerEntry = routeMarkerMapRef.current.get(courseId);
      if (!markerEntry) return;
      markerEntry.visualState = state;

      const icon = getRunningCourseMarkerIconUrlForCategory(markerEntry.category, state);
      if (typeof markerEntry.marker.setIcon === 'function') {
        markerEntry.marker.setIcon(icon);
        syncRouteMarkerDomVisualState(markerEntry.marker, state, courseId);
        return;
      }

      const map = mapRef.current;
      const route = routesRef.current.find((item) => item.id === courseId);
      const routeStart = route ? resolveRouteStartForMapMarker(route) : null;
      if (!map || !route || !routeStart) return;

      const nextMarker = createRouteMarker(
        isTmapRouteMarkerClusterLoaded() ? null : map,
        route,
        markerEntry.category,
        state,
      );
      if (!nextMarker) return;

      markerEntry.marker.setMap(null);
      routeMarkerMapRef.current.set(courseId, {
        marker: nextMarker,
        category: markerEntry.category,
        visualState: state,
        lat: markerEntry.lat,
        lng: markerEntry.lng,
        isVisible: markerEntry.isVisible,
        outOfViewportSinceMs: markerEntry.outOfViewportSinceMs,
      });
      attachRouteMarkerListeners(nextMarker, courseId);
      syncRouteMarkerDomVisualState(nextMarker, state, courseId);
      routeMarkerClusterGenerationRef.current += 1;
      syncRouteMarkersDisplayForZoom(map);
    },
    [
      attachRouteMarkerListeners,
      createRouteMarker,
      isTmapRouteMarkerClusterLoaded,
      mapRef,
      routeMarkerClusterGenerationRef,
      routeMarkerMapRef,
      routesRef,
      syncRouteMarkersDisplayForZoom,
    ],
  );
  routeVisualStateHandlerRef.current = setRouteMarkerVisualState;

  const syncSelectedMarkerVisual = useCallback(
    (nextSelectedCourseId: string | null, shouldFocusSelectedCourse: boolean) => {
      const previousSelectedId = selectedRouteIdRef.current;
      if (previousSelectedId && previousSelectedId !== nextSelectedCourseId) {
        setRouteMarkerVisualState(previousSelectedId, 'default');
      }
      selectedRouteIdRef.current = nextSelectedCourseId;
      if (nextSelectedCourseId) {
        setRouteMarkerVisualState(nextSelectedCourseId, 'clicked');
      }
      syncSelectedRoutePolyline(shouldFocusSelectedCourse ? nextSelectedCourseId : null);
    },
    [selectedRouteIdRef, setRouteMarkerVisualState, syncSelectedRoutePolyline],
  );
  selectedMarkerVisualHandlerRef.current = syncSelectedMarkerVisual;

  const syncRouteMarkers = useCallback(
    (map: TmapMap, nextRoutes: Route[]) => {
      const normalizedRoutes = nextRoutes
        .map((route) => ({ route, start: resolveRouteStartForMapMarker(route) }))
        .filter(
          (item): item is { route: Route; start: { lat: number; lng: number } } =>
            item.start !== null,
        );
      const nextIdSet = new Set(normalizedRoutes.map(({ route }) => route.id));
      const removedIds: string[] = [];
      routeMarkerMapRef.current.forEach((_entry, routeId) => {
        if (!nextIdSet.has(routeId)) removedIds.push(routeId);
      });

      let clusterStructureChanged = removedIds.length > 0;
      if (removedIds.length > 0) {
        tearDownRouteMarkerCluster();
        removedIds.forEach((routeId) => {
          const entry = routeMarkerMapRef.current.get(routeId);
          entry?.marker.setMap(null);
          routeMarkerMapRef.current.delete(routeId);
        });
      }

      normalizedRoutes.forEach(({ route, start }) => {
        const category = getRouteDistanceCategory(route);
        const state: MarkerVisualState =
          selectedRouteIdRef.current === route.id ? 'clicked' : 'default';
        const existing = routeMarkerMapRef.current.get(route.id);
        if (!existing) return;
        let discardExisting = false;
        if (existing.lat !== start.lat || existing.lng !== start.lng) {
          const Tmapv3 = getTmapv3();
          if (Tmapv3 && typeof existing.marker.setPosition === 'function') {
            existing.marker.setPosition(new Tmapv3.LatLng(start.lat, start.lng) as TmapLatLng);
            existing.lat = start.lat;
            existing.lng = start.lng;
            clusterStructureChanged = true;
          } else {
            discardExisting = true;
          }
        }
        if (discardExisting) {
          clusterStructureChanged = true;
          tearDownRouteMarkerCluster();
          existing.marker.setMap(null);
          routeMarkerMapRef.current.delete(route.id);
          return;
        }
        const categoryChanged = existing.category !== category;
        const stateChanged = existing.visualState !== state;
        if (categoryChanged) {
          existing.category = category;
          clusterStructureChanged = true;
        }
        if (stateChanged || categoryChanged) {
          existing.visualState = state;
          existing.marker.setIcon?.(getRunningCourseMarkerIconUrlForCategory(category, state));
          syncRouteMarkerDomVisualState(existing.marker, state, route.id);
        }
      });

      const routesToCreate = normalizedRoutes.filter(
        ({ route }) => !routeMarkerMapRef.current.has(route.id),
      );
      if (routesToCreate.length > 0) {
        clusterStructureChanged = true;
        tearDownRouteMarkerCluster();
        routesToCreate.forEach(({ route, start }) => {
          const category = getRouteDistanceCategory(route);
          const state: MarkerVisualState =
            selectedRouteIdRef.current === route.id ? 'clicked' : 'default';
          const marker = createRouteMarker(
            isTmapRouteMarkerClusterLoaded() ? null : map,
            route,
            category,
            state,
          );
          if (!marker) return;
          routeMarkerMapRef.current.set(route.id, {
            marker,
            category,
            visualState: state,
            lat: start.lat,
            lng: start.lng,
            isVisible: true,
            outOfViewportSinceMs: null,
          });
          attachRouteMarkerListeners(marker, route.id);
          syncRouteMarkerDomVisualState(marker, state, route.id);
        });
      }

      if (clusterStructureChanged) routeMarkerClusterGenerationRef.current += 1;
      routesSyncSigRef.current = buildRoutesSyncSignature(nextRoutes);
      syncRouteMarkersDisplayForZoom(map);
      logRouteMarkerAttachSnapshot(map, 'syncRouteMarkers 종료 직후');
    },
    [
      attachRouteMarkerListeners,
      createRouteMarker,
      getTmapv3,
      isTmapRouteMarkerClusterLoaded,
      logRouteMarkerAttachSnapshot,
      routeMarkerClusterGenerationRef,
      routeMarkerMapRef,
      routesSyncSigRef,
      selectedRouteIdRef,
      syncRouteMarkersDisplayForZoom,
      tearDownRouteMarkerCluster,
    ],
  );

  const clearRouteMarkers = useCallback(() => {
    tearDownRouteMarkerCluster();
    clearSelectedRoutePolyline();
    routeMarkerMapRef.current.forEach((entry) => {
      entry.marker.setMap(null);
    });
    routeMarkerMapRef.current.clear();
    routeMarkerRouteDisplayModeRef.current = 'individual';
    routeMarkerClusterAttachGenerationRef.current = -1;
    routeMarkerOverlaySignatureRef.current = '';
    routesSyncSigRef.current = null;
  }, [clearSelectedRoutePolyline, routeMarkerMapRef, routesSyncSigRef, tearDownRouteMarkerCluster]);

  return {
    syncRouteMarkersDisplayForZoom,
    scheduleMarkerVisibilitySync,
    syncSelectedMarkerVisual,
    syncRouteMarkers,
    clearRouteMarkers,
    logMarkerCoordinateAudit,
  };
}
