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

type CoordinateSystem = 'WGS84_LNGLAT' | 'WGS84_LATLNG' | 'EPSG3857';
type LatLng = { lat: number; lng: number };
type CoordinatePair = [number, number];
type CoordinateCandidate = { keyPath: string; pairs: CoordinatePair[] };

function toWgs84FromEpsg3857(x: number, y: number): LatLng {
  const normalizedLng = (x / 20037508.34) * 180;
  const projectedLat = (y / 20037508.34) * 180;
  const normalizedLat =
    (180 / Math.PI) * (2 * Math.atan(Math.exp((projectedLat * Math.PI) / 180)) - Math.PI / 2);

  return { lat: normalizedLat, lng: normalizedLng };
}

function normalizeWgs84Coordinate(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function detectCoordinateSystem(coordinates: number[][]): CoordinateSystem {
  let lngLatCount = 0;
  let latLngCount = 0;

  coordinates.forEach(([first, second]) => {
    if (Math.abs(first) <= 180 && Math.abs(second) <= 90) lngLatCount += 1;
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) latLngCount += 1;
  });

  if (lngLatCount === 0 && latLngCount === 0) return 'EPSG3857';
  return lngLatCount >= latLngCount ? 'WGS84_LNGLAT' : 'WGS84_LATLNG';
}

function normalizeCoordinatePair(
  value: CoordinatePair,
  coordinateSystem: CoordinateSystem = 'WGS84_LNGLAT',
): LatLng | null {
  const first = Number(value[0]);
  const second = Number(value[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  if (coordinateSystem === 'EPSG3857') {
    return toWgs84FromEpsg3857(first, second);
  }

  if (coordinateSystem === 'WGS84_LATLNG') {
    return normalizeWgs84Coordinate(first, second);
  }

  return normalizeWgs84Coordinate(second, first);
}

function parseCoordinatePair(value: unknown): CoordinatePair | null {
  if (Array.isArray(value) && value.length >= 2) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
    return null;
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const lat = Number(record.lat);
    const lng = Number(record.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lng, lat];
    }
  }

  return null;
}

function parseCoordinateSequence(value: unknown): CoordinatePair[] {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if ('coordinates' in record) {
      return parseCoordinateSequence(record.coordinates);
    }
    return [];
  }
  if (!Array.isArray(value)) return [];

  const sequence: CoordinatePair[] = [];
  value.forEach((item) => {
    const pair = parseCoordinatePair(item);
    if (pair) {
      sequence.push(pair);
      return;
    }

    // coordinates가 중첩 배열([[x,y], ...]) 또는 다중 라인([[[x,y], ...], ...])일 때 재귀적으로 펼친다.
    const nested = parseCoordinateSequence(item);
    if (nested.length > 0) sequence.push(...nested);
  });
  return sequence;
}

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function collectCoordinateCandidates(
  rawValue: unknown,
  keyPath = 'root',
  result: CoordinateCandidate[] = [],
): CoordinateCandidate[] {
  const value = parseJsonIfString(rawValue);

  if (Array.isArray(value)) {
    const sequence = parseCoordinateSequence(value);
    if (sequence.length >= 2) {
      result.push({ keyPath, pairs: sequence });
    }

    value.forEach((item, index) => {
      collectCoordinateCandidates(item, `${keyPath}[${index}]`, result);
    });
    return result;
  }

  if (typeof value !== 'object' || value === null) return result;
  const record = value as Record<string, unknown>;

  const geometry = parseJsonIfString(record.geometry);
  if (typeof geometry === 'object' && geometry !== null) {
    const geometryRecord = geometry as Record<string, unknown>;
    if (String(geometryRecord.type ?? '') === 'LineString') {
      const sequence = parseCoordinateSequence(parseJsonIfString(geometryRecord.coordinates));
      if (sequence.length >= 2) {
        result.push({ keyPath: `${keyPath}.geometry.coordinates`, pairs: sequence });
      }
    }
  }

  Object.entries(record).forEach(([key, nested]) => {
    const resolvedNested = parseJsonIfString(nested);
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'path' || lowerKey === 'features' || lowerKey === 'coordinates') {
      const sequence = parseCoordinateSequence(resolvedNested);
      if (sequence.length >= 2) {
        result.push({ keyPath: `${keyPath}.${key}`, pairs: sequence });
      }
    }
    collectCoordinateCandidates(resolvedNested, `${keyPath}.${key}`, result);
  });

  return result;
}

function normalizePathData(rawPathData: unknown): Record<string, unknown> | null {
  const data = parseJsonIfString(rawPathData);
  if (typeof data === 'string') {
    console.error('[CourseDetailMapPreview] path_data 문자열 JSON.parse 실패');
    return null;
  }
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  if (Array.isArray(data)) {
    try {
      return { path: data };
    } catch {
      return null;
    }
  }
  console.error('[CourseDetailMapPreview] path_data 타입이 객체/문자열이 아닙니다.');
  return null;
}

function extractPathCoordinates(rawPathData: unknown, courseId: string): LatLng[] {
  console.log('[DEBUG] 코스 ID:', courseId, '데이터 타입:', typeof rawPathData, '데이터 내용:', rawPathData);

  const pathData = normalizePathData(rawPathData);
  if (!pathData) return [];
  if (Object.keys(pathData).length === 0) {
    console.error(
      '[CourseDetailMapPreview] path_data가 비어 있습니다. 등록 로직(useCourseMap.ts)에서 path_data 저장값을 점검해 주세요.',
    );
    return [];
  }

  const candidates = collectCoordinateCandidates(pathData)
    .map((candidate) => {
      const key = candidate.keyPath.toLowerCase();
      const isPrimary =
        key.includes('.path') || key.includes('.features') || key.includes('linestring');
      return { ...candidate, isPrimary };
    })
    .filter((candidate) => candidate.pairs.length >= 2);

  if (candidates.length === 0) {
    console.error(
      '[CourseDetailMapPreview] 파싱 실패: path/features/fallback 어디에서도 유효한 좌표열을 찾지 못했습니다.',
    );
    return [];
  }

  const primaryCandidates = candidates.filter((candidate) => candidate.isPrimary);
  const pool = primaryCandidates.length > 0 ? primaryCandidates : candidates;
  const bestCandidate = pool.reduce((best, current) =>
    current.pairs.length > best.pairs.length ? current : best,
  );
  const coordinateSystem = detectCoordinateSystem(bestCandidate.pairs);

  const normalized = bestCandidate.pairs
    .map((pair) => normalizeCoordinatePair(pair, coordinateSystem))
    .filter((item): item is LatLng => item !== null);
  if (normalized.length < 2) {
    console.error('[CourseDetailMapPreview] 파싱 실패: 좌표 정규화 후 좌표 개수가 2개 미만입니다.');
  }
  return normalized;
}

function dedupeConsecutiveCoordinates(coordinates: LatLng[]): LatLng[] {
  if (coordinates.length <= 1) return coordinates;

  const deduped: LatLng[] = [coordinates[0]];
  for (let i = 1; i < coordinates.length; i += 1) {
    const previous = deduped[deduped.length - 1];
    const current = coordinates[i];
    if (previous.lat === current.lat && previous.lng === current.lng) continue;
    deduped.push(current);
  }
  return deduped;
}

function safelyDetachOverlay(overlay: { setMap: (map: unknown | null) => void } | null): void {
  if (!overlay) return;
  try {
    overlay.setMap(null);
  } catch (error) {
    // Tmap SDK 내부 removeLayer 타이밍 이슈로 간헐적 예외가 발생할 수 있어 안전하게 무시한다.
    console.warn('[CourseDetailMapPreview] overlay detach skipped:', error);
  }
}

export default function CourseDetailMapPreview({ course, mapLabel }: CourseDetailMapPreviewProps) {
  const mapRootIdRef = useRef(`course-detail-map-${Math.random().toString(36).slice(2, 10)}`);
  const mapRef = useRef<{ setCenter?: (target: unknown) => void; fitBounds?: (...args: unknown[]) => void } | null>(
    null,
  );
  const polylineRef = useRef<{ setMap: (map: unknown | null) => void } | null>(null);

  const pathCoordinates = useMemo(() => {
    const parsed = extractPathCoordinates(course.path_data, course.id);
    return dedupeConsecutiveCoordinates(parsed);
  }, [course.id, course.path_data]);

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
      safelyDetachOverlay(polylineRef.current);
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

        if (typeof mapInstance.fitBounds === 'function') {
          const latValues = pathCoordinates.map((coordinate) => coordinate.lat);
          const lngValues = pathCoordinates.map((coordinate) => coordinate.lng);
          const minLat = Math.min(...latValues);
          const maxLat = Math.max(...latValues);
          const minLng = Math.min(...lngValues);
          const maxLng = Math.max(...lngValues);
          const southWest = new Tmapv3.LatLng(minLat, minLng);
          const northEast = new Tmapv3.LatLng(maxLat, maxLng);

          if (typeof Tmapv3.LatLngBounds === 'function') {
            const bounds = new Tmapv3.LatLngBounds(southWest, northEast);
            mapInstance.fitBounds(bounds, 24);
          } else {
            mapInstance.fitBounds(southWest, northEast);
          }
        }
        return;
      }

      mapInstance.setCenter?.(new Tmapv3.LatLng(course.start_lat, course.start_lng));
    };

    mountMap();
    return () => {
      isCancelled = true;
      if (waitTimer !== null) window.clearTimeout(waitTimer);
      safelyDetachOverlay(polylineRef.current);
      polylineRef.current = null;
    };
  }, [course.start_lat, course.start_lng, pathCoordinates]);

  return (
    <div className={styles.mapPreviewInner}>
      <div id={mapRootIdRef.current} className={styles.mapCanvas} aria-label={mapLabel} />
    </div>
  );
}

