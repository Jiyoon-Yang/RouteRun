/**
 * 기존 코스 path_data를 도보 상세 경로(path) 기준으로 보정하는 마이그레이션 스크립트.
 */
import { createClient } from '@supabase/supabase-js';

const ROUTE_SELECT = 'id, path_data';
const TMAP_PEDESTRIAN_ROUTE_URL = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1';
const DETAILED_PATH_MIN_POINTS = 8;

function assertEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[migrate-route-path-data] 환경변수 ${name} 이(가) 필요합니다.`);
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonIfString(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizePoint(value) {
  if (!value || typeof value !== 'object') return null;

  const lat = Number(value.lat);
  const lng = Number(value.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

  if (Array.isArray(value) && value.length >= 2) {
    const first = Number(value[0]);
    const second = Number(value[1]);
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) return { lat: first, lng: second };
    if (Math.abs(first) <= 180 && Math.abs(second) <= 90) return { lat: second, lng: first };
  }

  return null;
}

function normalizePointArray(value) {
  const resolved = parseJsonIfString(value);
  if (!Array.isArray(resolved)) return [];

  return resolved
    .map((item) => normalizePoint(item))
    .filter((item) => item !== null);
}

function extractDetailedPathPoints(pathData) {
  if (!pathData || typeof pathData !== 'object') return [];

  const resolved = parseJsonIfString(pathData);
  if (Array.isArray(resolved)) return normalizePointArray(resolved);
  if (!resolved || typeof resolved !== 'object') return [];

  const fromPath = normalizePointArray(resolved.path);
  if (fromPath.length >= 2) return fromPath;

  const features = parseJsonIfString(resolved.features);
  if (!Array.isArray(features)) return [];

  const collected = [];
  for (const feature of features) {
    if (!feature || typeof feature !== 'object') continue;
    const geometry = parseJsonIfString(feature.geometry);
    if (!geometry || typeof geometry !== 'object') continue;
    if (String(geometry.type ?? '') !== 'LineString') continue;
    const sequence = normalizePointArray(geometry.coordinates);
    if (sequence.length > 0) collected.push(...sequence);
  }
  return collected;
}

function extractWaypointPoints(pathData) {
  const resolved = parseJsonIfString(pathData);
  if (Array.isArray(resolved)) {
    return normalizePointArray(resolved);
  }
  if (!resolved || typeof resolved !== 'object') return [];

  const fromWaypointPoints = normalizePointArray(resolved.waypoint_points);
  if (fromWaypointPoints.length >= 2) return fromWaypointPoints;

  const fromPoints = normalizePointArray(resolved.points);
  if (fromPoints.length >= 2) return fromPoints;

  const fromPath = normalizePointArray(resolved.path);
  return fromPath.length >= 2 ? fromPath : [];
}

function buildPassList(points) {
  if (points.length <= 2) return '';
  return points
    .slice(1, -1)
    .map((point) => `${point.lng},${point.lat}`)
    .join('_');
}

async function requestPedestrianPath(points, tmapApiKey) {
  const start = points[0];
  const end = points[points.length - 1];

  const response = await fetch(TMAP_PEDESTRIAN_ROUTE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      appKey: tmapApiKey,
    },
    body: JSON.stringify({
      startX: start.lng,
      startY: start.lat,
      endX: end.lng,
      endY: end.lat,
      passList: buildPassList(points),
      reqCoordType: 'WGS84GEO',
      resCoordType: 'WGS84GEO',
      startName: '출발지',
      endName: '도착지',
    }),
  });

  if (!response.ok) {
    throw new Error(`Tmap 보행자 경로 조회 실패: ${response.status}`);
  }

  const data = await response.json();
  const features = Array.isArray(data?.features) ? data.features : [];
  const path = [];

  for (const feature of features) {
    if (!feature?.geometry || feature.geometry.type !== 'LineString') continue;
    const sequence = normalizePointArray(feature.geometry.coordinates);
    if (sequence.length > 0) path.push(...sequence);
  }

  return path;
}

async function run() {
  const supabaseUrl = assertEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY');
  const tmapApiKey = assertEnv('NEXT_PUBLIC_TMAP_API_KEY');

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: routes, error } = await supabase.from('routes').select(ROUTE_SELECT);
  if (error) throw new Error(`[migrate-route-path-data] routes 조회 실패: ${error.message}`);

  const list = routes ?? [];
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`[migrate-route-path-data] 대상 코스 수: ${list.length}`);

  for (const route of list) {
    const routeId = route.id;
    const pathData = parseJsonIfString(route.path_data);

    const currentDetailedPath = extractDetailedPathPoints(pathData);
    if (currentDetailedPath.length >= DETAILED_PATH_MIN_POINTS) {
      skipped += 1;
      continue;
    }

    const waypoints = extractWaypointPoints(pathData);
    if (waypoints.length < 2) {
      console.warn(`[migrate-route-path-data] 건너뜀(${routeId}): 웨이포인트 부족`);
      skipped += 1;
      continue;
    }

    try {
      const detailedPath = await requestPedestrianPath(waypoints, tmapApiKey);
      if (detailedPath.length < 2) {
        console.warn(`[migrate-route-path-data] 건너뜀(${routeId}): 도보 상세 경로 없음`);
        skipped += 1;
        continue;
      }

      const base = pathData && typeof pathData === 'object' && !Array.isArray(pathData) ? pathData : {};
      const nextPathData = {
        ...base,
        path: detailedPath,
        waypoint_points: waypoints,
        path_source: 'pedestrianRoute.path:migrated',
      };

      const { error: updateError } = await supabase
        .from('routes')
        .update({ path_data: nextPathData })
        .eq('id', routeId);

      if (updateError) {
        failed += 1;
        console.error(`[migrate-route-path-data] 업데이트 실패(${routeId}): ${updateError.message}`);
      } else {
        migrated += 1;
        console.log(`[migrate-route-path-data] 완료(${routeId}): ${waypoints.length} -> ${detailedPath.length}`);
      }
    } catch (err) {
      failed += 1;
      console.error(
        `[migrate-route-path-data] 실패(${routeId}):`,
        err instanceof Error ? err.message : err,
      );
    }

    // 외부 API 호출 부하를 줄이기 위한 짧은 간격
    await sleep(180);
  }

  console.log('[migrate-route-path-data] 결과 요약');
  console.log(`- migrated: ${migrated}`);
  console.log(`- skipped : ${skipped}`);
  console.log(`- failed  : ${failed}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
