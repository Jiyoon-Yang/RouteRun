/**
 * CourseDetailMapPreview — 코스 상세 상단 미리보기 지도 렌더러.
 */
'use client';

import { useEffect, useMemo, useRef } from 'react';

import type { Route } from '@/commons/types/runroute';

import styles from './styles.module.css';

type CourseDetailMapPreviewProps = {
  course: Route;
  mapLabel: string;
};

function isCoordinateObject(value: unknown): value is { lat?: unknown; lng?: unknown } {
  return typeof value === 'object' && value !== null && ('lat' in value || 'lng' in value);
}

function normalizeCoordinatePair(value: unknown): { lat: number; lng: number } | null {
  if (Array.isArray(value) && value.length >= 2) {
    const first = Number(value[0]);
    const second = Number(value[1]);
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
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

export default function CourseDetailMapPreview({ course, mapLabel }: CourseDetailMapPreviewProps) {
  const mapRootIdRef = useRef(`course-detail-map-${Math.random().toString(36).slice(2, 10)}`);
  const mapRef = useRef<{ setCenter?: (target: unknown) => void; fitBounds?: (bounds: unknown) => void } | null>(
    null,
  );
  const polylineRef = useRef<{ setMap: (map: unknown | null) => void } | null>(null);

  const pathCoordinates = useMemo(() => {
    const coords: Array<{ lat: number; lng: number }> = [];
    collectCoordinatePairs(course.path_data, coords);
    return coords;
  }, [course.path_data]);

  useEffect(() => {
    let isCancelled = false;
    let waitTimer: number | null = null;

    const mountMap = () => {
      if (isCancelled) return;
      const rootElement = document.getElementById(mapRootIdRef.current);
      const Tmapv3 = window.Tmapv3;
      if (!rootElement || !Tmapv3) {
        waitTimer = window.setTimeout(mountMap, 120);
        return;
      }

      if (!mapRef.current) {
        mapRef.current = new Tmapv3.Map(mapRootIdRef.current, {
          center: new Tmapv3.LatLng(course.start_lat, course.start_lng),
          width: '100%',
          height: '100%',
          zoom: 15,
          zoomControl: false,
          scrollwheel: false,
        });
      }

      const mapInstance = mapRef.current;
      if (!mapInstance) return;
      polylineRef.current?.setMap(null);
      polylineRef.current = null;

      if (pathCoordinates.length >= 2) {
        const latLngPath = pathCoordinates.map((coordinate) => new Tmapv3.LatLng(coordinate.lat, coordinate.lng));
        polylineRef.current = new Tmapv3.Polyline({
          map: mapInstance,
          path: latLngPath,
          strokeColor: '#2F80FF',
          strokeWeight: 6,
          strokeOpacity: 0.95,
        });
      }

      mapInstance.setCenter?.(new Tmapv3.LatLng(course.start_lat, course.start_lng));
    };

    mountMap();
    return () => {
      isCancelled = true;
      if (waitTimer !== null) window.clearTimeout(waitTimer);
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [course.start_lat, course.start_lng, pathCoordinates]);

  return (
    <div className={styles.mapPreviewInner}>
      <div id={mapRootIdRef.current} className={styles.mapCanvas} aria-label={mapLabel} />
    </div>
  );
}

