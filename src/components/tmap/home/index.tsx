'use client';

import { useEffect, useRef } from 'react';

import styles from './styles.module.css';

/** simpleMap 예제과 동일: 서울시청 인근 초기 좌표, zoom 15 */
const INITIAL_CENTER = { lat: 37.566481622437934, lng: 126.98502302169841 };

type TmapV2API = {
  Map: new (id: string, options: Record<string, unknown>) => unknown;
  LatLng: new (lat: number, lng: number) => unknown;
};

function getTmapv2(): TmapV2API | undefined {
  return (window as Window & { Tmapv2?: TmapV2API }).Tmapv2;
}

export function TmapHome() {
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const initTmap = () => {
      if (cancelled) return;
      const Tmapv2 = getTmapv2();
      if (!Tmapv2) {
        timer = setTimeout(initTmap, 50);
        return;
      }
      if (mapInstance.current) return;

      const map = new Tmapv2.Map('map_div', {
        center: new Tmapv2.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng),
        width: '100%',
        height: '400px',
        zoom: 15,
      });
      mapInstance.current = map;
    };

    initTmap();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      mapInstance.current = null;
    };
  }, []);

  return (
    <div className={styles.root}>
      <div id="map_div" className={styles.map} />
    </div>
  );
}

export default TmapHome;
