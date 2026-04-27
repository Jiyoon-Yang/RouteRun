'use client';

import { useEffect, useId, useRef } from 'react';

import type { TmapPointLike } from '@/commons/types/tmap';

import { useCourseMap, type SaveRoutePayload } from './hooks/useCourseMap';
import styles from './styles.module.css';

type CourseSubmitMapProps = {
  onSaveRoute?: (payload: SaveRoutePayload) => void;
};

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export default function TmapCourseSubmit({ onSaveRoute }: CourseSubmitMapProps) {
  const mapContainerId = useId().replace(/:/g, '-');
  const mapContainerIdRef = useRef(`tmap-course-submit-${mapContainerId}`);
  const mapInstanceInitRef = useRef(false);

  const {
    points,
    distanceKm,
    isSaving,
    errorMessage,
    isPointLimitReached,
    waypointCount,
    setMapInstance,
    addPoint,
    undo,
    reset,
    saveRoute,
  } = useCourseMap({ onSaveRoute });

  useEffect(() => {
    if (mapInstanceInitRef.current) return;

    let cancelled = false;

    const initialize = () => {
      if (cancelled || mapInstanceInitRef.current) return;
      const Tmapv2 = window.Tmapv2;
      const mapElementId = mapContainerIdRef.current;
      if (!Tmapv2 || !document.getElementById(mapElementId)) {
        window.setTimeout(initialize, 120);
        return;
      }

      const map = new Tmapv2.Map(mapElementId, {
        center: new Tmapv2.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        width: '100%',
        height: '100%',
        zoom: 15,
        zoomControl: true,
        scrollwheel: true,
      });

      setMapInstance(map);
      mapInstanceInitRef.current = true;

      const clickListener = (event?: TmapPointLike) => {
        const latLng = event?.latLng ?? event?._latLng;
        if (!latLng) return;
        addPoint(latLng);
      };

      if (Tmapv2.Event?.addListener) {
        Tmapv2.Event.addListener(map as object, 'click', clickListener);
      } else if (Tmapv2.event?.addListener) {
        Tmapv2.event.addListener(map as object, 'click', clickListener);
      }
    };

    initialize();
    return () => {
      cancelled = true;
    };
  }, [addPoint, setMapInstance]);

  return (
    <section className={styles.root}>
      <div id={mapContainerIdRef.current} className={styles.map} />

      <div className={styles.topControls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={undo}
          disabled={points.length === 0}
        >
          되돌리기
        </button>
        <button
          type="button"
          className={styles.controlButton}
          onClick={reset}
          disabled={points.length === 0}
        >
          초기화
        </button>
      </div>

      <div className={styles.bottomPanel}>
        <div className={styles.metaPanel}>
          <p className={styles.metaText}>
            선택 지점: {points.length}/7 (경유지 {waypointCount}/5)
          </p>
          <p className={styles.metaText}>
            확정 거리: {distanceKm !== null ? `${distanceKm.toFixed(2)} km` : '-'}
          </p>
          {isPointLimitReached && (
            <p className={styles.warningText}>최대 7개 지점까지 선택할 수 있습니다.</p>
          )}
          {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
        </div>

        <button
          type="button"
          className={styles.saveButton}
          onClick={() => void saveRoute()}
          disabled={isSaving || points.length < 2}
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </section>
  );
}
