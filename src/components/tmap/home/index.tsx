'use client';

import { useCallback, useEffect, useRef, type CSSProperties } from 'react';

import { Icon } from '@/commons/components/icons';
import type { Route } from '@/commons/types/runroute';
import { hasValidRouteStartCoordinate, SEOUL_CITY_HALL_COORDINATE } from '@/commons/utils/geo';
import { getDistanceCategory, type DistanceCategory } from '@/components/home/utils/course-filter';

import {
  getRunningCourseMarkerIconUrlForCategory,
  type MarkerVisualState,
} from './build-running-course-marker-icon';
import styles from './styles.module.css';

type TmapV2API = {
  Map: new (id: string, options: Record<string, unknown>) => TmapMap;
  LatLng: new (lat: number, lng: number) => TmapLatLng;
  Size: new (width: number, height: number) => unknown;
  Point?: new (x: number, y: number) => unknown;
  Marker: new (options: Record<string, unknown>) => TmapMarker;
  event?: {
    addListener?: (target: TmapMarker, eventName: string, callback: () => void) => void;
  };
  Event?: {
    addListener?: (target: TmapMarker, eventName: string, callback: () => void) => void;
  };
};

// [유틸] 전역 Tmapv2 객체 접근 래퍼
function getTmapv2(): TmapV2API | undefined {
  return (window as unknown as { Tmapv2?: TmapV2API }).Tmapv2;
}

type TmapLatLng = {
  lat: () => number;
  lng: () => number;
};

type TmapMarker = {
  setMap: (map: TmapMap | null) => void;
  setPosition: (position: TmapLatLng) => void;
  setIcon: (icon: string) => void;
  addListener?: (eventName: string, callback: () => void) => void;
};

type TmapMap = {
  setCenter: (center: TmapLatLng) => void;
  getZoom?: () => number;
  addListener?: (eventName: string, callback: () => void) => void;
};

type TmapHomeProps = {
  bottomSheetVisibleHeight?: number;
  isBottomSheetExpanded?: boolean;
  routes?: Route[];
  selectedCourseId?: string | null;
  onCourseMarkerClick?: (courseId: string) => void;
};

type RouteMarkerEntry = {
  marker: TmapMarker;
  category: DistanceCategory;
  title: string;
};

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

export function TmapHome({
  bottomSheetVisibleHeight = 24,
  isBottomSheetExpanded = false,
  routes = [],
  selectedCourseId = null,
  onCourseMarkerClick,
}: TmapHomeProps) {
  // [상태] 지도/마커 인스턴스 참조 관리
  const mapInstance = useRef<TmapMap | null>(null);
  const currentLocationMarkerRef = useRef<TmapMarker | null>(null);
  const selectedLabelMarkerRef = useRef<TmapMarker | null>(null);
  const routeMarkerMapRef = useRef<Map<string, RouteMarkerEntry>>(new Map());
  const routesRef = useRef<Route[]>(routes);
  const selectedRouteIdRef = useRef<string | null>(null);

  const getRouteDistanceCategory = (route: Route): DistanceCategory => {
    if (!Number.isFinite(route.distance_meters) || route.distance_meters < 0) {
      return 'BETWEEN_3_AND_5';
    }
    return getDistanceCategory(route.distance_meters);
  };

  // [마커] 현재 위치 마커 생성 및 좌표 갱신
  const createCustomMarker = (map: TmapMap, lat: number, lng: number) => {
    const Tmapv2 = getTmapv2();
    if (!Tmapv2) return;

    const nextPosition = new Tmapv2.LatLng(lat, lng);

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(map);
      currentLocationMarkerRef.current.setPosition(nextPosition);
      return;
    }

    const marker = new Tmapv2.Marker({
      position: nextPosition,
      map: map,
      title: '내 현재 위치',
    });

    currentLocationMarkerRef.current = marker;
  };

  const upsertSelectedLabelMarker = useCallback((courseId: string | null) => {
    const map = mapInstance.current;
    const Tmapv2 = getTmapv2();
    if (!map || !Tmapv2 || !courseId) {
      selectedLabelMarkerRef.current?.setMap(null);
      return;
    }

    const route = routesRef.current.find((item) => item.id === courseId);
    if (!route || !hasValidRouteStartCoordinate(route)) {
      selectedLabelMarkerRef.current?.setMap(null);
      return;
    }

    const zoomLevel = map.getZoom?.();
    const { width, height } = getLabelIconSize(route.title, zoomLevel);
    const labelIconHeight = height + Math.round(40 * getLabelScaleByZoom(zoomLevel));
    const icon = buildMarkerLabelIconUrl(route.title, width, height, zoomLevel);
    const position = new Tmapv2.LatLng(route.start_lat, route.start_lng);
    const options: Record<string, unknown> = {
      position,
      map,
      icon,
      iconSize: new Tmapv2.Size(width, labelIconHeight),
    };
    if (Tmapv2.Point) {
      options.iconAnchor = new Tmapv2.Point(width / 2, labelIconHeight);
    }

    // SDK 내부 상태(null screenSize) 충돌을 피하기 위해 라벨 마커는 갱신 시 재생성한다.
    selectedLabelMarkerRef.current?.setMap(null);
    selectedLabelMarkerRef.current = new Tmapv2.Marker(options);
  }, []);

  const addMarkerListener = useCallback(
    (marker: TmapMarker, eventName: 'click' | 'mouseover' | 'mouseout', callback: () => void) => {
      const Tmapv2 = getTmapv2();
      if (!Tmapv2) return;

      if (typeof marker.addListener === 'function') {
        try {
          marker.addListener(eventName, callback);
          return;
        } catch {
          // marker 인스턴스 기반 이벤트 등록 실패 시 전역 API로 폴백
        }
      }

      const tryAddListener = (
        eventApi:
          | {
              addListener?: (target: TmapMarker, name: string, cb: () => void) => void;
            }
          | undefined,
      ) => {
        if (!eventApi?.addListener) return false;
        try {
          // SDK 버전별로 내부 this 바인딩 요구사항이 달라 call로 안전하게 바인딩한다.
          eventApi.addListener.call(eventApi, marker, eventName, callback);
          return true;
        } catch {
          return false;
        }
      };

      if (tryAddListener(Tmapv2.Event)) return;
      tryAddListener(Tmapv2.event);
    },
    [],
  );

  const setRouteMarkerVisualState = useCallback((courseId: string, state: MarkerVisualState) => {
    const markerEntry = routeMarkerMapRef.current.get(courseId);
    if (!markerEntry) return;
    markerEntry.marker.setIcon(
      getRunningCourseMarkerIconUrlForCategory(markerEntry.category, state),
    );
  }, []);

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
    },
    [clearAllRouteMarkerLabels, setRouteMarkerLabelVisible, setRouteMarkerVisualState],
  );

  const syncRouteMarkers = useCallback(
    (map: TmapMap, nextRoutes: Route[]) => {
      // [동기화] 코스 마커 목록 증분 동기화
      const Tmapv2 = getTmapv2();
      if (!Tmapv2) return;

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
          existingMarker.marker.setPosition(new Tmapv2.LatLng(route.start_lat, route.start_lng));
          const state: MarkerVisualState =
            selectedRouteIdRef.current === route.id ? 'clicked' : 'default';
          existingMarker.marker.setIcon(getRunningCourseMarkerIconUrlForCategory(category, state));
          setRouteMarkerLabelVisible(route.id, selectedRouteIdRef.current === route.id);
          return;
        }

        const icon = getRunningCourseMarkerIconUrlForCategory(category, 'default');
        const markerOptions: Record<string, unknown> = {
          position: new Tmapv2.LatLng(route.start_lat, route.start_lng),
          map,
          title: '',
          label: '',
          icon,
          iconSize: new Tmapv2.Size(30, 38),
        };
        if (Tmapv2.Point) {
          markerOptions.iconAnchor = new Tmapv2.Point(16, 36);
        }
        const marker = new Tmapv2.Marker(markerOptions);
        routeMarkerMapRef.current.set(route.id, {
          marker,
          category,
          title: route.title,
        });

        addMarkerListener(marker, 'mouseover', () => {
          if (selectedRouteIdRef.current === route.id) return;
          setRouteMarkerVisualState(route.id, 'hover');
        });

        addMarkerListener(marker, 'mouseout', () => {
          if (selectedRouteIdRef.current === route.id) return;
          setRouteMarkerVisualState(route.id, 'default');
        });

        addMarkerListener(marker, 'click', () => {
          syncSelectedMarkerVisual(route.id);
          onCourseMarkerClick?.(route.id);
        });
      });
    },
    [
      addMarkerListener,
      onCourseMarkerClick,
      setRouteMarkerLabelVisible,
      setRouteMarkerVisualState,
      syncSelectedMarkerVisual,
    ],
  );

  // [이벤트] 현재 위치 재탐색 버튼 처리
  const handleRefreshLocation = () => {
    const map = mapInstance.current;
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const Tmapv2 = getTmapv2();
        if (Tmapv2) {
          map.setCenter(new Tmapv2.LatLng(latitude, longitude));
          createCustomMarker(map, latitude, longitude);
        }
      },
      (error) => {
        console.error('위치 갱신 실패:', error);
        alert('위치 정보를 가져올 수 없습니다.');
      },
    );
  };

  useEffect(() => {
    routesRef.current = routes;
  }, [routes]);

  useEffect(() => {
    // [초기화] 지도 라이브러리 로드 대기 및 최초 지도 생성
    let cancelled = false;

    const initTmap = (lat: number, lng: number) => {
      if (cancelled) return;
      const Tmapv2 = getTmapv2();
      if (!Tmapv2 || mapInstance.current) return;

      const map = new Tmapv2.Map('map_div', {
        center: new Tmapv2.LatLng(lat, lng),
        width: '100%',
        height: '100%',
        zoom: 15,
      });

      createCustomMarker(map, lat, lng);
      mapInstance.current = map;
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
        );
      } else {
        initTmap(SEOUL_CITY_HALL_COORDINATE.lat, SEOUL_CITY_HALL_COORDINATE.lng);
      }
    };

    const checkLibrary = () => {
      if (getTmapv2()) {
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
      routeMarkerMap.clear();
      mapInstance.current = null;
      currentLocationMarkerRef.current = null;
      selectedLabelMarkerRef.current = null;
      selectedRouteIdRef.current = null;
    };
  }, [syncRouteMarkers]);

  useEffect(() => {
    // [동기화] 코스 데이터 변경 시 마커 반영
    const map = mapInstance.current;
    if (!map) return;
    syncRouteMarkers(map, routes);
  }, [routes, syncRouteMarkers]);

  useEffect(() => {
    // [동기화] 외부 선택 상태(selectedCourseId)와 마커 clicked 상태 정합성 유지
    syncSelectedMarkerVisual(selectedCourseId);
  }, [selectedCourseId, syncSelectedMarkerVisual]);

  useEffect(() => {
    // [동기화] 선택된 코스가 바뀌면 해당 시작 좌표로 지도 중심 이동
    if (!selectedCourseId) return;
    const map = mapInstance.current;
    const Tmapv2 = getTmapv2();
    if (!map || !Tmapv2) return;

    const selectedRoute = routes.find((route) => route.id === selectedCourseId);
    if (!selectedRoute || !hasValidRouteStartCoordinate(selectedRoute)) return;

    map.setCenter(new Tmapv2.LatLng(selectedRoute.start_lat, selectedRoute.start_lng));
  }, [routes, selectedCourseId]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || typeof map.addListener !== 'function') return;
    map.addListener('zoom_changed', () => {
      upsertSelectedLabelMarker(selectedRouteIdRef.current);
    });
  }, [upsertSelectedLabelMarker]);

  const refreshButtonStyle = {
    '--sheet-visible-height': `${bottomSheetVisibleHeight}px`,
  } as CSSProperties;

  return (
    <div className={styles.root}>
      <div id="map_div" className={styles.map} />
      <button
        type="button"
        className={`${styles.refreshButton} ${isBottomSheetExpanded ? styles.refreshButtonHidden : ''}`}
        style={refreshButtonStyle}
        onClick={handleRefreshLocation}
      >
        <Icon name="locateFixed" size={24} className={styles.refreshIcon} />
      </button>
    </div>
  );
}

export default TmapHome;
