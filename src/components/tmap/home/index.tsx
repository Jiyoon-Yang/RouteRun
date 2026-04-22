'use client';

import { useCallback, useEffect, useRef, type CSSProperties } from 'react';

import { Icon } from '@/commons/components/icons';
import type { Route } from '@/commons/types/runroute';
import { hasValidRouteStartCoordinate, SEOUL_CITY_HALL_COORDINATE } from '@/commons/utils/geo';

import styles from './styles.module.css';

type TmapV2API = {
  Map: new (id: string, options: Record<string, unknown>) => TmapMap;
  LatLng: new (lat: number, lng: number) => TmapLatLng;
  Marker: new (options: Record<string, unknown>) => TmapMarker;
  event?: {
    addListener: (target: TmapMarker, eventName: string, callback: () => void) => void;
  };
  Event?: {
    addListener: (target: TmapMarker, eventName: string, callback: () => void) => void;
  };
};

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
};

type TmapMap = {
  setCenter: (center: TmapLatLng) => void;
};

type TmapHomeProps = {
  bottomSheetVisibleHeight?: number;
  isBottomSheetExpanded?: boolean;
  routes?: Route[];
  onCourseMarkerClick?: (courseId: string) => void;
};

export function TmapHome({
  bottomSheetVisibleHeight = 24,
  isBottomSheetExpanded = false,
  routes = [],
  onCourseMarkerClick,
}: TmapHomeProps) {
  const mapInstance = useRef<TmapMap | null>(null);
  const currentLocationMarkerRef = useRef<TmapMarker | null>(null);
  const routeMarkerMapRef = useRef<Map<string, TmapMarker>>(new Map());
  const routesRef = useRef<Route[]>(routes);

  // 현재 위치 마커를 생성하거나 기존 마커 위치를 갱신
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

  const bindMarkerClick = useCallback(
    (marker: TmapMarker, courseId: string) => {
      if (!onCourseMarkerClick) return;

      const Tmapv2 = getTmapv2();
      if (!Tmapv2) return;

      if (Tmapv2.event) {
        Tmapv2.event.addListener(marker, 'click', () => {
          onCourseMarkerClick(courseId);
        });
        return;
      }

      if (Tmapv2.Event) {
        Tmapv2.Event.addListener(marker, 'click', () => {
          onCourseMarkerClick(courseId);
        });
      }
    },
    [onCourseMarkerClick],
  );

  const syncRouteMarkers = useCallback(
    (map: TmapMap, nextRoutes: Route[]) => {
      const Tmapv2 = getTmapv2();
      if (!Tmapv2) return;

      const normalizedRoutes = nextRoutes.filter(hasValidRouteStartCoordinate);
      const nextRouteIds = new Set(normalizedRoutes.map((route) => route.id));

      routeMarkerMapRef.current.forEach((marker, routeId) => {
        if (!nextRouteIds.has(routeId)) {
          marker.setMap(null);
          routeMarkerMapRef.current.delete(routeId);
        }
      });

      normalizedRoutes.forEach((route) => {
        if (routeMarkerMapRef.current.has(route.id)) return;

        const marker = new Tmapv2.Marker({
          position: new Tmapv2.LatLng(route.start_lat, route.start_lng),
          map,
          title: route.title,
        });
        bindMarkerClick(marker, route.id);
        routeMarkerMapRef.current.set(route.id, marker);
      });
    },
    [bindMarkerClick],
  );

  // 버튼 클릭 시 실행될 현재 위치 갱신 함수
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
      routeMarkerMap.forEach((marker) => marker.setMap(null));
      routeMarkerMap.clear();
      mapInstance.current = null;
      currentLocationMarkerRef.current = null;
    };
  }, [syncRouteMarkers]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    syncRouteMarkers(map, routes);
  }, [routes, syncRouteMarkers]);

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
