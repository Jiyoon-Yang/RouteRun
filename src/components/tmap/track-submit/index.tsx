'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Icon } from '@/commons/components/icons';
import { getCurrentPositionWithFallback } from '@/commons/utils/geo/geolocation';
import { getTmapv3Runtime } from '@/commons/utils/tmap/runtime';
import type { TmapMap } from '@/commons/utils/tmap/types';
import { useCurrentLocationMarker } from '@/components/tmap/commons/hooks/useCurrentLocationMarker';

import { useTrackMap, type SaveTrackPayload } from './hooks/useTrackMap';
import styles from './styles.module.css';

type TrackSubmitMapProps = {
  onSaveTrack?: (payload: SaveTrackPayload) => void;
};

export default function TmapTrackSubmit({ onSaveTrack }: TrackSubmitMapProps) {
  const mapContainerId = useId().replace(/:/g, '-');
  const mapContainerIdRef = useRef(`tmap-track-submit-${mapContainerId}`);
  const [isDistanceFocused, setIsDistanceFocused] = useState(false);

  const { createCurrentLocationMarker } = useCurrentLocationMarker();
  const {
    trackPoint,
    distanceMeters,
    setDistanceMeters,
    isSaving,
    canSave,
    mapRef,
    initializeMap,
    reset,
    saveTrack,
  } = useTrackMap({ onSaveTrack });

  useEffect(() => {
    let cancelled = false;

    const initialize = () => {
      if (cancelled) return;
      const mapElementId = mapContainerIdRef.current;
      if (!getTmapv3Runtime() || !document.getElementById(mapElementId)) {
        window.setTimeout(initialize, 120);
        return;
      }

      getCurrentPositionWithFallback((lat, lng) => {
        if (cancelled) return;
        initializeMap(mapElementId, { lat, lng });
        const map = mapRef.current;
        if (map) {
          createCurrentLocationMarker(map as TmapMap, lat, lng);
        }
      });
    };

    initialize();
    return () => {
      cancelled = true;
    };
  }, [createCurrentLocationMarker, initializeMap, mapRef]);

  const handleRefreshLocation = useCallback(() => {
    getCurrentPositionWithFallback((lat, lng) => {
      const map = mapRef.current;
      if (!map) return;
      const Tmapv3 = getTmapv3Runtime();
      if (!Tmapv3) return;
      (map as TmapMap).setCenter(new Tmapv3.LatLng(lat, lng));
    });
  }, [mapRef]);

  return (
    <section className={styles.root}>
      <div id={mapContainerIdRef.current} className={styles.map} />

      {/* 우측 상단: 초기화만 (되돌리기 없음) */}
      <div className={styles.topRightControls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={reset}
          disabled={!trackPoint}
        >
          <Icon name="rotateCcw" size={24} />
          <span className={styles.controlButtonLabel}>초기화</span>
        </button>
      </div>

      {/* 현재 위치 버튼 */}
      <button type="button" className={styles.locationButton} onClick={handleRefreshLocation}>
        <Icon name="locateFixed" size={24} />
      </button>

      {/* 하단 바 */}
      <div className={styles.bottomBar}>
        {/* 트랙 거리 입력 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon name="ruler" size={15} color="#7d7d7d" />
            <span>트랙 거리 (m)</span>
            <span className={styles.requiredMark} aria-hidden="true">
              *
            </span>
          </div>
          <input
            type="number"
            className={styles.distanceInput}
            min={1}
            step={1}
            value={distanceMeters === 0 ? '' : distanceMeters}
            placeholder={isDistanceFocused ? '' : '거리 입력'}
            onFocus={() => setIsDistanceFocused(true)}
            onBlur={() => setIsDistanceFocused(false)}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setDistanceMeters(Number.isFinite(val) && val > 0 ? val : 0);
            }}
          />
        </div>

        <div className={styles.divider} />

        {/* 트랙 저장 */}
        <div className={styles.saveSection}>
          <button
            type="button"
            className={`${styles.saveButton} ${canSave ? styles.saveButtonActive : ''}`}
            onClick={() => saveTrack()}
            disabled={isSaving || !canSave}
          >
            <Icon name="save" size={14} />
            <span>트랙 저장</span>
          </button>
        </div>
      </div>
    </section>
  );
}
