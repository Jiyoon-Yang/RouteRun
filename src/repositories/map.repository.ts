import type {
  TmapCoordinate,
  TmapPedestrianRouteFeature,
  TmapPedestrianRouteResponse,
} from '@/commons/types/tmap';

const TMAP_PEDESTRIAN_ROUTE_URL = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1';

export type PedestrianRouteResult = {
  totalDistanceMeters: number;
  path: TmapCoordinate[];
};

function buildPassList(points: TmapCoordinate[]): string {
  if (points.length <= 2) return '';
  return points
    .slice(1, -1)
    .map((point) => `${point.lng},${point.lat}`)
    .join('_');
}

function parseLineStringCoordinates(feature: TmapPedestrianRouteFeature): TmapCoordinate[] {
  if (feature.geometry.type !== 'LineString') return [];

  return (feature.geometry.coordinates as number[][])
    .filter((coordinate) => coordinate.length >= 2)
    .map((coordinate) => ({
      lng: Number(coordinate[0]),
      lat: Number(coordinate[1]),
    }))
    .filter((coordinate) => Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng));
}

export async function getPedestrianRoute(points: TmapCoordinate[]): Promise<PedestrianRouteResult> {
  if (points.length < 2) {
    throw new Error('보행자 경로 탐색은 최소 2개 좌표가 필요합니다.');
  }

  const appKey = process.env.NEXT_PUBLIC_TMAP_API_KEY;
  if (!appKey) {
    throw new Error('NEXT_PUBLIC_TMAP_API_KEY가 설정되지 않았습니다.');
  }

  const start = points[0];
  const end = points[points.length - 1];

  const response = await fetch(TMAP_PEDESTRIAN_ROUTE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      appKey,
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
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Tmap 보행자 경로 조회 실패: ${response.status}`);
  }

  const data = (await response.json()) as TmapPedestrianRouteResponse;
  const path = data.features.flatMap(parseLineStringCoordinates);
  const totalDistanceMeters = data.features.reduce((distance, feature) => {
    if (typeof feature.properties.totalDistance === 'number') {
      return Math.max(distance, feature.properties.totalDistance);
    }
    return distance;
  }, 0);

  return { totalDistanceMeters, path };
}
