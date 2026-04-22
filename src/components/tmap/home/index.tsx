'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

import { Icon } from '@/commons/components/icons';

import styles from './styles.module.css';

// 비상용 기본 좌표 (서울시청) _ 위치권한 비허용 시 기본 좌표
const DEFAULT_CENTER = { lat: 37.566481622437934, lng: 126.98502302169841 };

type TmapV2API = {
  Map: new (id: string, options: Record<string, unknown>) => any;
  LatLng: new (lat: number, lng: number) => any;
  Marker: new (options: Record<string, unknown>) => any;
};

function getTmapv2(): TmapV2API | undefined {
  return (window as any).Tmapv2;
}

type TmapHomeProps = {
  bottomSheetVisibleHeight?: number;
  isBottomSheetExpanded?: boolean;
};

export function TmapHome({
  bottomSheetVisibleHeight = 24,
  isBottomSheetExpanded = false,
}: TmapHomeProps) {
  const mapInstance = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);

  // 현재 위치 마커를 생성하거나 기존 마커 위치를 갱신
  const createCustomMarker = (map: any, lat: number, lng: number) => {
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
    };

    const startWithLocation = () => {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            initTmap(position.coords.latitude, position.coords.longitude);
          },
          () => {
            initTmap(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
          },
        );
      } else {
        initTmap(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
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

    return () => {
      cancelled = true;
      mapInstance.current = null;
      currentLocationMarkerRef.current = null;
    };
  }, []);

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
