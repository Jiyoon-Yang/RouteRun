'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Icon } from '@/commons/components/icons';
import type { Route } from '@/commons/types/runroute';
import { hasValidRouteStartCoordinate, SEOUL_CITY_HALL_COORDINATE } from '@/commons/utils/geo';
import type { RouteViewport } from '@/components/home/hooks/index.use-routes';
import { getDistanceCategory, type DistanceCategory } from '@/components/home/utils/course-filter';

import {
  getRunningCourseMarkerIconUrlForCategory,
  type MarkerVisualState,
} from './build-running-course-marker-icon';
import styles from './styles.module.css';

type TmapV3API = {
  Map: new (id: string, options: Record<string, unknown>) => TmapMap;
  LatLng: new (lat: number, lng: number) => TmapLatLng;
  Size: new (width: number, height: number) => unknown;
  Point?: new (x: number, y: number) => unknown;
  Marker: new (options: Record<string, unknown>) => TmapMarker;
  Polyline: new (options: Record<string, unknown>) => TmapPolyline;
  event?: {
    addListener?: (target: TmapMarker, eventName: string, callback: () => void) => void;
  };
  Event?: {
    addListener?: (target: TmapMarker, eventName: string, callback: () => void) => void;
  };
};

// [유틸] 전역 Tmapv3 객체 접근 래퍼
function getTmapv3(): TmapV3API | undefined {
  const globalWindow = window as unknown as {
    Tmapv3?: TmapV3API;
  };
  return globalWindow.Tmapv3;
}

type TmapLatLng = {
  lat?: (() => number) | number;
  lng?: (() => number) | number;
  _lat?: number;
  _lng?: number;
  latValue?: number;
  lngValue?: number;
};

type TmapMarker = {
  setMap: (map: TmapMap | null) => void;
  setPosition: (position: TmapLatLng) => void;
  setIcon?: (icon: string) => void;
  addListener?: (eventName: string, callback: () => void) => void;
  on?: (eventName: string, callback: () => void) => void;
  getElement?: () => HTMLElement | null;
};

type TmapPolyline = {
  setMap: (map: TmapMap | null) => void;
  getPath?: () => TmapLatLng[];
};

type TmapMap = {
  setCenter: (center: TmapLatLng) => void;
  setZoom: (zoomLevel: number, options?: Record<string, unknown>) => void;
  getZoom: () => number;
  setZoomLimit?: (minZoom: number, maxZoom: number) => void;
  getMinZoom?: () => number;
  getMaxZoom?: () => number;
  zoomIn?: () => void;
  zoomOut?: () => void;
  addListener?: (eventName: string, callback: () => void) => void;
  on?: (eventName: string, callback: () => void) => void;
  resize?: () => void;
  getBounds?: () => TmapLatLngBoundsLike | null | undefined;
};

type TmapLatLngBoundsLike = {
  getNorthEast?: () => TmapLatLng;
  getSouthWest?: () => TmapLatLng;
};

type TmapHomeProps = {
  bottomSheetVisibleHeight?: number;
  isBottomSheetExpanded?: boolean;
  routes?: Route[];
  selectedCourseId?: string | null;
  onCourseMarkerClick?: (courseId: string) => void;
  onViewportChanged?: (viewport: RouteViewport) => void;
};

type RouteMarkerEntry = {
  marker: TmapMarker;
  category: DistanceCategory;
  title: string;
  visualState: MarkerVisualState;
  lat: number;
  lng: number;
  isVisible: boolean;
};

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

const MIN_ZOOM_LEVEL = 11;
const MAX_ZOOM_LEVEL = 19;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toSvgDataUrl(svgMarkup: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
}

function getCurrentLocationIndicatorSizeByZoom(_zoomLevel: number | undefined): number {
  return 40;
}

function getCurrentLocationIndicatorIconUrl(size: number): string {
  // 기본 A 마커 대신, 파란 점 + 반투명 링 형태의 현재 위치 인디케이터를 사용한다.
  const center = size / 2;
  const outerRingRadius = Math.round(size * 0.42);
  const innerWhiteRadius = Math.round(size * 0.23);
  const dotRadius = Math.round(size * 0.17);
  const coreRadius = Math.round(size * 0.13);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${center}" cy="${center}" r="${outerRingRadius}" fill="#2F80FF" opacity="0.16"/>
  <circle cx="${center}" cy="${center}" r="${innerWhiteRadius}" fill="#FFFFFF" opacity="0.98"/>
  <circle cx="${center}" cy="${center}" r="${dotRadius}" fill="#2F80FF"/>
  <circle cx="${center}" cy="${center}" r="${coreRadius}" fill="#2F80FF"/>
</svg>
`.trim();
  return toSvgDataUrl(svg);
}

function getLabelScaleByZoom(zoomLevel: number | undefined): number {
  const zoom = typeof zoomLevel === 'number' ? zoomLevel : 15;
  if (zoom <= 13) return 0.88;
  if (zoom === 14) return 0.94;
  if (zoom === 15) return 1;
  if (zoom === 16) return 1.08;
  return 1.14;
}

function getLabelIconSize(
  title: string,
  zoomLevel: number | undefined,
): { width: number; height: number } {
  const scale = getLabelScaleByZoom(zoomLevel);
  const baseWidth = Math.max(120, Math.min(300, title.length * 12 + 32)) * scale;
  const baseHeight = 40 * scale;
  const evenWidth = baseWidth % 2 === 0 ? baseWidth : baseWidth + 1;
  const evenHeight = baseHeight % 2 === 0 ? baseHeight : baseHeight + 1;
  return { width: Math.round(evenWidth), height: Math.round(evenHeight) };
}

function buildMarkerLabelIconUrl(
  title: string,
  width: number,
  height: number,
  zoomLevel: number | undefined,
): string {
  const safeTitle = escapeHtml(title);
  const scale = getLabelScaleByZoom(zoomLevel);
  const liftGap = Math.round(84 * scale);
  const totalHeight = height + liftGap;
  const y = height / 2 + 1;
  const textX = width / 2;
  const radius = Math.round(12 * scale);
  const fontSize = Math.round(14 * scale);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="#2F3146"/>
  <text x="${textX}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="${fontSize}" font-weight="700">${safeTitle}</text>
</svg>
`.trim();

  return toSvgDataUrl(svg);
}

function isCoordinateObject(value: unknown): value is { lat?: unknown; lng?: unknown } {
  return typeof value === 'object' && value !== null && ('lat' in value || 'lng' in value);
}

function normalizeCoordinatePair(value: unknown): { lat: number; lng: number } | null {
  if (Array.isArray(value) && value.length >= 2) {
    const first = Number(value[0]);
    const second = Number(value[1]);
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
    // GeoJSON/Tmap 경로 응답은 일반적으로 [lng, lat] 순서를 사용한다.
    if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
      return { lat: second, lng: first };
    }
    return { lat: first, lng: second };
  }

  if (isCoordinateObject(value)) {
    const lat = Number(value.lat);
    const lng = Number(value.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

function collectCoordinatePairs(value: unknown, result: Array<{ lat: number; lng: number }>) {
  const directCoordinate = normalizeCoordinatePair(value);
  if (directCoordinate) {
    result.push(directCoordinate);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectCoordinatePairs(item, result));
    return;
  }

  if (typeof value !== 'object' || value === null) return;
  const record = value as Record<string, unknown>;
  if (record.type === 'Point') return;
  if ('coordinates' in record) {
    collectCoordinatePairs(record.coordinates, result);
    return;
  }
  if ('geometry' in record) {
    collectCoordinatePairs(record.geometry, result);
    return;
  }
  if ('features' in record) {
    collectCoordinatePairs(record.features, result);
    return;
  }
  if ('path' in record) {
    collectCoordinatePairs(record.path, result);
  }
}

export function TmapHome({
  bottomSheetVisibleHeight = 24,
  isBottomSheetExpanded = false,
  routes = [],
  selectedCourseId = null,
  onCourseMarkerClick,
  onViewportChanged,
}: TmapHomeProps) {
  const [isMobileOrTabletViewport, setIsMobileOrTabletViewport] = useState(false);
  // [상태] 지도/마커 인스턴스 참조 관리
  const mapInstance = useRef<TmapMap | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const currentLocationMarkerRef = useRef<TmapMarker | null>(null);
  const currentLocationCoordinateRef = useRef<{ lat: number; lng: number } | null>(null);
  const selectedLabelMarkerRef = useRef<TmapMarker | null>(null);
  const selectedRoutePolylineRef = useRef<TmapPolyline | null>(null);
  const routeMarkerMapRef = useRef<Map<string, RouteMarkerEntry>>(new Map());
  const routesRef = useRef<Route[]>(routes);
  const selectedRouteIdRef = useRef<string | null>(null);
  const viewportReportTimerRef = useRef<number | null>(null);
  const viewportSyncIntervalRef = useRef<number | null>(null);
  const mapListenersRegisteredRef = useRef(false);
  const wheelZoomThrottleTimerRef = useRef<number | null>(null);
  const zoomUpdateRafRef = useRef<number | null>(null);
  const markerVisibilityRafRef = useRef<number | null>(null);
  const lastAppliedZoomRef = useRef<number | null>(null);
  const lastViewportRef = useRef<RouteViewport | null>(null);
  const routeVisualStateHandlerRef = useRef<(courseId: string, state: MarkerVisualState) => void>(
    () => undefined,
  );
  const selectedMarkerVisualHandlerRef = useRef<(courseId: string | null) => void>(() => undefined);
  const selectedPolylineHandlerRef = useRef<(courseId: string | null) => void>(() => undefined);

  const readCoordinateValue = (
    point: TmapLatLng | undefined,
    axis: 'lat' | 'lng',
  ): number | null => {
    if (!point) return null;
    const rawValue = axis === 'lat' ? point.lat : point.lng;
    if (typeof rawValue === 'function') {
      const methodValue = rawValue();
      if (typeof methodValue === 'number') return methodValue;
    }
    if (typeof rawValue === 'number') return rawValue;
    const fallback =
      axis === 'lat' ? (point._lat ?? point.latValue) : (point._lng ?? point.lngValue);
    return typeof fallback === 'number' ? fallback : null;
  };

  const normalizeViewportFromMap = useCallback((map: TmapMap): RouteViewport | null => {
    const bounds = map.getBounds?.();
    if (!bounds) return null;
    const northEast = bounds.getNorthEast?.();
    const southWest = bounds.getSouthWest?.();
    if (!northEast || !southWest) return null;
    const northEastLat = readCoordinateValue(northEast, 'lat');
    const northEastLng = readCoordinateValue(northEast, 'lng');
    const southWestLat = readCoordinateValue(southWest, 'lat');
    const southWestLng = readCoordinateValue(southWest, 'lng');
    if (
      northEastLat === null ||
      northEastLng === null ||
      southWestLat === null ||
      southWestLng === null
    ) {
      return null;
    }

    return {
      northEastLat,
      northEastLng,
      southWestLat,
      southWestLng,
    };
  }, []);

  const reportViewport = useCallback(
    (map: TmapMap) => {
      const viewport = normalizeViewportFromMap(map);
      if (!viewport) return;
      const previous = lastViewportRef.current;
      if (
        previous &&
        previous.northEastLat === viewport.northEastLat &&
        previous.northEastLng === viewport.northEastLng &&
        previous.southWestLat === viewport.southWestLat &&
        previous.southWestLng === viewport.southWestLng
      ) {
        return;
      }
      lastViewportRef.current = viewport;
      onViewportChanged?.(viewport);
    },
    [normalizeViewportFromMap, onViewportChanged],
  );

  const syncMarkerVisibilityByViewport = useCallback((map: TmapMap) => {
    const viewport = normalizeViewportFromMap(map);
    if (!viewport) return;
    const west = viewport.southWestLng;
    const east = viewport.northEastLng;
    const south = viewport.southWestLat;
    const north = viewport.northEastLat;
    const isCrossingDateLine = west > east;
    const isLngInRange = (lng: number) =>
      isCrossingDateLine ? lng >= west || lng <= east : lng >= west && lng <= east;

    routeMarkerMapRef.current.forEach((entry) => {
      const isInViewport =
        entry.lat >= south && entry.lat <= north && isLngInRange(entry.lng);
      if (isInViewport === entry.isVisible) return;
      entry.marker.setMap(isInViewport ? map : null);
      entry.isVisible = isInViewport;
    });
  }, [normalizeViewportFromMap]);

  const scheduleMarkerVisibilitySync = useCallback((map: TmapMap) => {
    if (markerVisibilityRafRef.current !== null) return;
    markerVisibilityRafRef.current = window.requestAnimationFrame(() => {
      markerVisibilityRafRef.current = null;
      syncMarkerVisibilityByViewport(map);
    });
  }, [syncMarkerVisibilityByViewport]);

  const enforceMinZoomLevel = useCallback((map: TmapMap): number | null => {
    const currentZoom = map.getZoom();
    if (typeof currentZoom !== 'number') return null;
    if (currentZoom < MIN_ZOOM_LEVEL) {
      map.setZoom(MIN_ZOOM_LEVEL);
      return MIN_ZOOM_LEVEL;
    }
    return currentZoom;
  }, []);

  const scheduleViewportReport = useCallback(
    (map: TmapMap, delay = 220) => {
      if (viewportReportTimerRef.current) {
        window.clearTimeout(viewportReportTimerRef.current);
      }
      viewportReportTimerRef.current = window.setTimeout(() => {
        reportViewport(map);
      }, delay);
    },
    [reportViewport],
  );

  const getRouteDistanceCategory = (route: Route): DistanceCategory => {
    if (!Number.isFinite(route.distance_meters) || route.distance_meters < 0) {
      return 'BETWEEN_3_AND_5';
    }
    return getDistanceCategory(route.distance_meters);
  };

  // [마커] 현재 위치 마커 생성 및 좌표 갱신
  const createCustomMarker = (map: TmapMap, lat: number, lng: number) => {
    const Tmapv3 = getTmapv3();
    if (!Tmapv3) return;
    currentLocationCoordinateRef.current = { lat, lng };

    const nextPosition = new Tmapv3.LatLng(lat, lng);
    const zoomLevel = map.getZoom();
    const indicatorSize = getCurrentLocationIndicatorSizeByZoom(zoomLevel);
    const icon = getCurrentLocationIndicatorIconUrl(indicatorSize);
    const markerOptions: Record<string, unknown> = {
      position: nextPosition,
      map: map,
      title: '내 현재 위치',
      icon,
      iconSize: new Tmapv3.Size(indicatorSize, indicatorSize),
    };
    if (Tmapv3.Point) {
      markerOptions.iconAnchor = new Tmapv3.Point(indicatorSize / 2, indicatorSize / 2);
      markerOptions.offset = new Tmapv3.Point(indicatorSize / 2, indicatorSize / 2);
    }

    // 줌 레벨에 따라 아이콘 크기가 달라지므로 현재 위치 마커는 갱신 시 재생성한다.
    currentLocationMarkerRef.current?.setMap(null);
    currentLocationMarkerRef.current = new Tmapv3.Marker(markerOptions);
  };

  const upsertSelectedLabelMarker = useCallback((courseId: string | null) => {
    const map = mapInstance.current;
    const Tmapv3 = getTmapv3();
    if (!map || !Tmapv3 || !courseId) {
      selectedLabelMarkerRef.current?.setMap(null);
      return;
    }

    const route = routesRef.current.find((item) => item.id === courseId);
    if (!route || !hasValidRouteStartCoordinate(route)) {
      selectedLabelMarkerRef.current?.setMap(null);
      return;
    }

    const zoomLevel = map.getZoom();
    const { width, height } = getLabelIconSize(route.title, zoomLevel);
    const labelIconHeight = height + Math.round(40 * getLabelScaleByZoom(zoomLevel));
    const icon = buildMarkerLabelIconUrl(route.title, width, height, zoomLevel);
    const position = new Tmapv3.LatLng(route.start_lat, route.start_lng);
    const options: Record<string, unknown> = {
      position,
      map,
      icon,
      iconSize: new Tmapv3.Size(width, labelIconHeight),
    };
    if (Tmapv3.Point) {
      options.iconAnchor = new Tmapv3.Point(width / 2, labelIconHeight);
      options.offset = new Tmapv3.Point(width / 2, labelIconHeight);
    }

    // SDK 내부 상태(null screenSize) 충돌을 피하기 위해 라벨 마커는 갱신 시 재생성한다.
    selectedLabelMarkerRef.current?.setMap(null);
    selectedLabelMarkerRef.current = new Tmapv3.Marker(options);
  }, []);

  const registerMapListeners = useCallback(
    (map: TmapMap) => {
      if (mapListenersRegisteredRef.current) return;

      const bindMapEvent = (eventNames: string[], callback: () => void): boolean => {
        let bound = false;
        eventNames.forEach((eventName) => {
          if (typeof map.on === 'function') {
            map.on(eventName, callback);
            bound = true;
            return;
          }
          if (typeof map.addListener === 'function') {
            map.addListener(eventName, callback);
            bound = true;
          }
        });
        return bound;
      };

      // 일부 Tmap SDK 런타임은 on/addListener 중 하나만 제공하므로 둘 다 대응한다.
      const hasMapEventBinder =
        typeof map.on === 'function' || typeof map.addListener === 'function';
      if (!hasMapEventBinder) return;

      const handleZoomChanged = () => {
        const currentZoom = enforceMinZoomLevel(map);
        if (currentZoom === null) return;
        if (currentZoom === lastAppliedZoomRef.current) {
          scheduleMarkerVisibilitySync(map);
          scheduleViewportReport(map);
          return;
        }
        lastAppliedZoomRef.current = currentZoom;
        if (zoomUpdateRafRef.current !== null) return;
        zoomUpdateRafRef.current = window.requestAnimationFrame(() => {
          zoomUpdateRafRef.current = null;
          upsertSelectedLabelMarker(selectedRouteIdRef.current);
          const currentLocation = currentLocationCoordinateRef.current;
          if (currentLocation) {
            createCustomMarker(map, currentLocation.lat, currentLocation.lng);
          }
          scheduleMarkerVisibilitySync(map);
          scheduleViewportReport(map);
        });
      };

      const boundZoomEvents = bindMapEvent(
        ['zoom', 'zoom_end', 'zoom_changed', 'zoomend', 'idle'],
        handleZoomChanged,
      );

      const reportAfterMove = () => {
        scheduleMarkerVisibilitySync(map);
        scheduleViewportReport(map);
      };

      const boundMoveEvents = bindMapEvent(
        ['drag', 'dragend', 'dragEnd', 'moveend', 'bounds_changed', 'center_changed', 'panend'],
        reportAfterMove,
      );

      mapListenersRegisteredRef.current = boundZoomEvents || boundMoveEvents;
    },
    [
      enforceMinZoomLevel,
      scheduleMarkerVisibilitySync,
      scheduleViewportReport,
      upsertSelectedLabelMarker,
    ],
  );

  const addMarkerListener = useCallback(
    (marker: TmapMarker, eventName: 'click' | 'mouseover' | 'mouseout', callback: () => void) => {
      if (typeof marker.on === 'function') {
        try {
          marker.on(eventName, callback);
          return;
        } catch {
          // marker.on 실패 시 폴백
        }
      }

      if (typeof marker.addListener === 'function') {
        try {
          marker.addListener(eventName, callback);
        } catch {
          // noop
        }
      }
    },
    [],
  );

  const createRouteMarker = useCallback(
    (
      map: TmapMap,
      route: Route,
      category: DistanceCategory,
      visualState: MarkerVisualState,
    ): TmapMarker | null => {
      const Tmapv3 = getTmapv3();
      if (!Tmapv3 || !hasValidRouteStartCoordinate(route)) return null;

      const markerOptions: Record<string, unknown> = {
        position: new Tmapv3.LatLng(route.start_lat, route.start_lng),
        map,
        title: '',
        label: '',
        icon: getRunningCourseMarkerIconUrlForCategory(category, visualState),
        iconSize: new Tmapv3.Size(30, 38),
      };
      if (Tmapv3.Point) {
        markerOptions.iconAnchor = new Tmapv3.Point(16, 36);
        markerOptions.offset = new Tmapv3.Point(16, 36);
      }

      return new Tmapv3.Marker(markerOptions);
    },
    [],
  );

  const attachRouteMarkerListeners = useCallback(
    (marker: TmapMarker, routeId: string) => {
      addMarkerListener(marker, 'mouseover', () => {
        if (selectedRouteIdRef.current === routeId) return;
        routeVisualStateHandlerRef.current(routeId, 'hover');
      });

      addMarkerListener(marker, 'mouseout', () => {
        if (selectedRouteIdRef.current === routeId) return;
        routeVisualStateHandlerRef.current(routeId, 'default');
      });

      addMarkerListener(marker, 'click', () => {
        selectedMarkerVisualHandlerRef.current(routeId);
        selectedPolylineHandlerRef.current(routeId);
        onCourseMarkerClick?.(routeId);
      });
    },
    [addMarkerListener, onCourseMarkerClick],
  );

  const setRouteMarkerVisualState = useCallback(
    (courseId: string, state: MarkerVisualState) => {
      const markerEntry = routeMarkerMapRef.current.get(courseId);
      if (!markerEntry) return;
      markerEntry.visualState = state;

      const icon = getRunningCourseMarkerIconUrlForCategory(markerEntry.category, state);
      if (typeof markerEntry.marker.setIcon === 'function') {
        markerEntry.marker.setIcon(icon);
        return;
      }

      const map = mapInstance.current;
      const route = routesRef.current.find((item) => item.id === courseId);
      if (!map || !route || !hasValidRouteStartCoordinate(route)) return;

      const nextMarker = createRouteMarker(map, route, markerEntry.category, state);
      if (!nextMarker) return;

      markerEntry.marker.setMap(null);
      routeMarkerMapRef.current.set(courseId, {
        marker: nextMarker,
        category: markerEntry.category,
        title: markerEntry.title,
        visualState: state,
      });
      attachRouteMarkerListeners(nextMarker, courseId);
    },
    [attachRouteMarkerListeners, createRouteMarker],
  );
  routeVisualStateHandlerRef.current = setRouteMarkerVisualState;

  const setRouteMarkerLabelVisible = useCallback(
    (courseId: string, visible: boolean) => {
      if (!visible) {
        selectedLabelMarkerRef.current?.setMap(null);
        return;
      }
      upsertSelectedLabelMarker(courseId);
    },
    [upsertSelectedLabelMarker],
  );

  const syncSelectedRoutePolyline = useCallback((courseId: string | null) => {
    selectedRoutePolylineRef.current?.setMap(null);
    selectedRoutePolylineRef.current = null;

    const map = mapInstance.current;
    const Tmapv3 = getTmapv3();
    if (!map || !Tmapv3 || !courseId) return;

    const route = routesRef.current.find((item) => item.id === courseId);
    if (!route) return;

    const coordinates: Array<{ lat: number; lng: number }> = [];
    collectCoordinatePairs(route.path_data, coordinates);
    if (coordinates.length < 2) return;

    const path = coordinates.map((coordinate) => new Tmapv3.LatLng(coordinate.lat, coordinate.lng));
    selectedRoutePolylineRef.current = new Tmapv3.Polyline({
      map,
      path,
      strokeColor: '#2F80FF',
      strokeWeight: 6,
      strokeOpacity: 0.9,
    });
  }, []);
  selectedPolylineHandlerRef.current = syncSelectedRoutePolyline;

  const clearAllRouteMarkerLabels = useCallback(() => {
    routeMarkerMapRef.current.forEach((_entry, routeId) => {
      setRouteMarkerLabelVisible(routeId, false);
    });
  }, [setRouteMarkerLabelVisible]);

  const syncSelectedMarkerVisual = useCallback(
    (nextSelectedCourseId: string | null) => {
      const previousSelectedId = selectedRouteIdRef.current;

      clearAllRouteMarkerLabels();

      if (previousSelectedId && previousSelectedId !== nextSelectedCourseId) {
        setRouteMarkerVisualState(previousSelectedId, 'default');
      }

      selectedRouteIdRef.current = nextSelectedCourseId;

      if (nextSelectedCourseId) {
        setRouteMarkerVisualState(nextSelectedCourseId, 'clicked');
        setRouteMarkerLabelVisible(nextSelectedCourseId, true);
      }
      syncSelectedRoutePolyline(nextSelectedCourseId);
    },
    [
      clearAllRouteMarkerLabels,
      setRouteMarkerLabelVisible,
      setRouteMarkerVisualState,
      syncSelectedRoutePolyline,
    ],
  );
  selectedMarkerVisualHandlerRef.current = syncSelectedMarkerVisual;

  const syncRouteMarkers = useCallback(
    (map: TmapMap, nextRoutes: Route[]) => {
      // [동기화] 코스 마커 목록 증분 동기화
      const Tmapv3 = getTmapv3();
      if (!Tmapv3) return;

      const normalizedRoutes = nextRoutes.filter(hasValidRouteStartCoordinate);
      const nextRouteIds = new Set(normalizedRoutes.map((route) => route.id));

      routeMarkerMapRef.current.forEach((markerEntry, routeId) => {
        if (!nextRouteIds.has(routeId)) {
          markerEntry.marker.setMap(null);
          routeMarkerMapRef.current.delete(routeId);
          if (selectedRouteIdRef.current === routeId) {
            selectedRouteIdRef.current = null;
          }
        }
      });

      normalizedRoutes.forEach((route) => {
        const category = getRouteDistanceCategory(route);
        const existingMarker = routeMarkerMapRef.current.get(route.id);
        if (existingMarker) {
          existingMarker.category = category;
          existingMarker.title = route.title;
          existingMarker.lat = route.start_lat;
          existingMarker.lng = route.start_lng;
          existingMarker.marker.setPosition(new Tmapv3.LatLng(route.start_lat, route.start_lng));
          const state: MarkerVisualState =
            selectedRouteIdRef.current === route.id ? 'clicked' : 'default';
          setRouteMarkerVisualState(route.id, state);
          setRouteMarkerLabelVisible(route.id, selectedRouteIdRef.current === route.id);
          return;
        }

        const marker = createRouteMarker(map, route, category, 'default');
        if (!marker) return;
        routeMarkerMapRef.current.set(route.id, {
          marker,
          category,
          title: route.title,
          visualState: 'default',
          lat: route.start_lat,
          lng: route.start_lng,
          isVisible: true,
        });

        // 신규 생성 시 반드시 클릭 리스너를 바인딩한다.
        attachRouteMarkerListeners(marker, route.id);
      });
    },
    [
      attachRouteMarkerListeners,
      createRouteMarker,
      setRouteMarkerLabelVisible,
      setRouteMarkerVisualState,
    ],
  );

  // [이벤트] 현재 위치 재탐색 버튼 처리
  const handleRefreshLocation = () => {
    const map = mapInstance.current;
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const Tmapv3 = getTmapv3();
        if (Tmapv3) {
          map.setCenter(new Tmapv3.LatLng(latitude, longitude));
          createCustomMarker(map, latitude, longitude);
        }
      },
      (error) => {
        console.error('위치 갱신 실패:', error);
        alert('위치 정보를 가져올 수 없습니다.');
      },
      PRECISE_GEOLOCATION_OPTIONS,
    );
  };

  const adjustZoomLevel = useCallback((delta: 1 | -1) => {
    const map = mapInstance.current;
    if (!map) return;

    const runtimeZoom = map.getZoom();
    if (typeof runtimeZoom !== 'number') return;
    const nextZoom =
      delta < 0
        ? Math.max(MIN_ZOOM_LEVEL, runtimeZoom + delta)
        : Math.min(MAX_ZOOM_LEVEL, runtimeZoom + delta);
    if (nextZoom === runtimeZoom) return;
    // Tmap이 제공하는 zoomIn/zoomOut을 우선 사용해 부드러운 전환을 유도한다.
    if (delta > 0 && typeof map.zoomIn === 'function') {
      map.zoomIn();
      return;
    }
    if (delta < 0 && typeof map.zoomOut === 'function') {
      map.zoomOut();
      return;
    }

    // zoomIn/zoomOut 미지원 런타임에서는 애니메이션 옵션을 포함해 폴백한다.
    map.setZoom(nextZoom, { animation: true, animate: true, duration: 200 });
  }, []);

  // [이벤트] 휠 줌을 버튼과 동일한 제한 로직으로 통일
  const handleMapWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const map = mapInstance.current;
      if (!map) return;
      if (wheelZoomThrottleTimerRef.current !== null) return;

      const delta: 1 | -1 = event.deltaY < 0 ? 1 : -1;
      adjustZoomLevel(delta);
      scheduleViewportReport(map);

      wheelZoomThrottleTimerRef.current = window.setTimeout(() => {
        wheelZoomThrottleTimerRef.current = null;
      }, 100);
    },
    [adjustZoomLevel, scheduleViewportReport],
  );

  useEffect(() => {
    routesRef.current = routes;
  }, [routes]);

  useEffect(() => {
    // [초기화] 지도 라이브러리 로드 대기 및 최초 지도 생성
    let cancelled = false;

    const initTmap = (lat: number, lng: number) => {
      if (cancelled) return;
      const Tmapv3 = getTmapv3();
      if (!Tmapv3 || mapInstance.current) return;

      const map = new Tmapv3.Map('map_div', {
        center: new Tmapv3.LatLng(lat, lng),
        width: '100%',
        height: '100%',
        zoom: 15,
        minZoom: MIN_ZOOM_LEVEL,
        zoomControl: false,
        scrollwheel: false,
      });

      map.setZoomLimit?.(MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL);
      lastAppliedZoomRef.current = map.getZoom();
      createCustomMarker(map, lat, lng);
      mapInstance.current = map;
      enforceMinZoomLevel(map);
      registerMapListeners(map);
      scheduleViewportReport(map, 500);
      if (viewportSyncIntervalRef.current !== null) {
        window.clearInterval(viewportSyncIntervalRef.current);
      }
      // 이벤트 누락 환경에서도 뷰포트 기반 마커/카드 동기화를 보장한다.
      viewportSyncIntervalRef.current = window.setInterval(() => {
        scheduleMarkerVisibilitySync(map);
        reportViewport(map);
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
        setTimeout(checkLibrary, 100);
      }
    };

    checkLibrary();

    const routeMarkerMap = routeMarkerMapRef.current;

    return () => {
      cancelled = true;
      routeMarkerMap.forEach((entry) => {
        entry.marker.setMap(null);
      });
      selectedLabelMarkerRef.current?.setMap(null);
      selectedRoutePolylineRef.current?.setMap(null);
      routeMarkerMap.clear();
      mapInstance.current = null;
      currentLocationMarkerRef.current = null;
      currentLocationCoordinateRef.current = null;
      selectedLabelMarkerRef.current = null;
      selectedRoutePolylineRef.current = null;
      selectedRouteIdRef.current = null;
      mapListenersRegisteredRef.current = false;
      if (viewportSyncIntervalRef.current !== null) {
        window.clearInterval(viewportSyncIntervalRef.current);
        viewportSyncIntervalRef.current = null;
      }
      if (wheelZoomThrottleTimerRef.current !== null) {
        window.clearTimeout(wheelZoomThrottleTimerRef.current);
        wheelZoomThrottleTimerRef.current = null;
      }
      if (zoomUpdateRafRef.current !== null) {
        window.cancelAnimationFrame(zoomUpdateRafRef.current);
        zoomUpdateRafRef.current = null;
      }
      if (markerVisibilityRafRef.current !== null) {
        window.cancelAnimationFrame(markerVisibilityRafRef.current);
        markerVisibilityRafRef.current = null;
      }
      lastAppliedZoomRef.current = null;
      lastViewportRef.current = null;
    };
  }, [
    enforceMinZoomLevel,
    registerMapListeners,
    reportViewport,
    scheduleMarkerVisibilitySync,
    scheduleViewportReport,
    syncRouteMarkers,
  ]);

  useEffect(() => {
    // [동기화] 코스 데이터 변경 시 마커 반영
    const map = mapInstance.current;
    if (!map) return;
    syncRouteMarkers(map, routes);
    scheduleMarkerVisibilitySync(map);
  }, [routes, scheduleMarkerVisibilitySync, syncRouteMarkers]);

  useEffect(() => {
    // [동기화] 외부 선택 상태(selectedCourseId)와 마커 clicked 상태 정합성 유지
    syncSelectedMarkerVisual(selectedCourseId);
  }, [selectedCourseId, syncSelectedMarkerVisual]);

  useEffect(() => {
    // [동기화] 선택된 코스가 바뀌면 해당 시작 좌표로 지도 중심 이동
    if (!selectedCourseId) return;
    const map = mapInstance.current;
    const Tmapv3 = getTmapv3();
    if (!map || !Tmapv3) return;

    const selectedRoute = routes.find((route) => route.id === selectedCourseId);
    if (!selectedRoute || !hasValidRouteStartCoordinate(selectedRoute)) return;

    map.setCenter(new Tmapv3.LatLng(selectedRoute.start_lat, selectedRoute.start_lng));
  }, [routes, selectedCourseId]);

  useEffect(() => {
    return () => {
      if (viewportReportTimerRef.current) {
        window.clearTimeout(viewportReportTimerRef.current);
        viewportReportTimerRef.current = null;
      }
      if (viewportSyncIntervalRef.current !== null) {
        window.clearInterval(viewportSyncIntervalRef.current);
        viewportSyncIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const syncViewportType = () => {
      setIsMobileOrTabletViewport(mediaQuery.matches);
    };

    syncViewportType();
    mediaQuery.addEventListener('change', syncViewportType);
    return () => {
      mediaQuery.removeEventListener('change', syncViewportType);
    };
  }, []);

  useEffect(() => {
    const rootElement = rootRef.current;
    if (!rootElement) return;

    const wheelListener = (event: WheelEvent) => {
      handleMapWheel(event);
    };

    rootElement.addEventListener('wheel', wheelListener, { passive: false });
    return () => {
      rootElement.removeEventListener('wheel', wheelListener);
    };
  }, [handleMapWheel]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const resizeMap = () => {
      map.resize?.();
      window.dispatchEvent(new Event('resize'));
    };

    resizeMap();
    const timerId = window.setTimeout(resizeMap, 180);
    return () => window.clearTimeout(timerId);
  }, [bottomSheetVisibleHeight, isBottomSheetExpanded]);

  const sheetControlPositionClassName =
    bottomSheetVisibleHeight <= 24 ? styles.sheetControlsCollapsed : styles.sheetControlsPeek;
  const shouldHideFloatingControls =
    isBottomSheetExpanded || (isMobileOrTabletViewport && bottomSheetVisibleHeight >= 320);

  return (
    <div ref={rootRef} className={styles.root}>
      <div id="map_div" className={styles.map} />
      <button
        type="button"
        className={`${styles.refreshButton} ${sheetControlPositionClassName} ${shouldHideFloatingControls ? styles.refreshButtonHidden : ''}`}
        onClick={handleRefreshLocation}
      >
        <Icon name="locateFixed" size={24} className={styles.refreshIcon} />
      </button>
      <div
        className={`${styles.zoomButtonGroup} ${sheetControlPositionClassName} ${shouldHideFloatingControls ? styles.refreshButtonHidden : ''}`}
      >
        <button type="button" className={styles.zoomButton} onClick={() => adjustZoomLevel(1)}>
          <Icon name="plus" size={20} className={styles.zoomButtonIcon} />
        </button>
        <button type="button" className={styles.zoomButton} onClick={() => adjustZoomLevel(-1)}>
          <Icon name="minus" size={20} className={styles.zoomButtonIcon} />
        </button>
      </div>
    </div>
  );
}

export default TmapHome;
