import type { ReferenceLocation, Route } from '@/commons/types/runroute';

type Coordinate = {
  lat: number;
  lng: number;
};

type ReverseGeocodingAddressInfo = {
  city_do?: string;
  gu_gun?: string;
};

type ReverseGeocodingResponse = {
  addressInfo?: ReverseGeocodingAddressInfo;
};

type ReverseGeocodeRegionParams = {
  lat: number;
  lng: number;
  appKey: string;
  signal?: AbortSignal;
};

const EARTH_RADIUS_METERS = 6_371_000;

export const SEOUL_CITY_HALL_COORDINATE: Coordinate = {
  lat: 37.566481622437934,
  lng: 126.98502302169841,
};

export const SEOUL_CITY_HALL_REFERENCE: ReferenceLocation = {
  type: 'SEOUL_CITY_HALL_DEFAULT',
  ...SEOUL_CITY_HALL_COORDINATE,
};

function toRadian(value: number): number {
  return (value * Math.PI) / 180;
}

// [검증] 위경도 범위 및 숫자 유효성 검증
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}

// [검증] 코스 시작 좌표 유효성 검증
export function hasValidRouteStartCoordinate(
  route: Pick<Route, 'start_lat' | 'start_lng'>,
): boolean {
  return isValidCoordinate(route.start_lat, route.start_lng);
}

// [계산] Haversine 기반 직선거리 계산
export function calculateLinearDistanceMeters(origin: Coordinate, target: Coordinate): number {
  const deltaLat = toRadian(target.lat - origin.lat);
  const deltaLng = toRadian(target.lng - origin.lng);
  const lat1 = toRadian(origin.lat);
  const lat2 = toRadian(target.lat);

  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatRegionAddress(addressInfo?: ReverseGeocodingAddressInfo): string | null {
  if (!addressInfo) {
    return null;
  }

  const city = addressInfo.city_do?.trim() ?? '';
  const district = addressInfo.gu_gun?.trim() ?? '';
  const formatted = [city, district].filter(Boolean).join(' ');
  return formatted || null;
}

// [조회] 리버스지오코딩으로 시/도 + 구/군 주소 반환
export async function reverseGeocodeRegion({
  lat,
  lng,
  appKey,
  signal,
}: ReverseGeocodeRegionParams): Promise<string | null> {
  if (!isValidCoordinate(lat, lng) || !appKey.trim()) {
    return null;
  }

  const searchParams = new URLSearchParams({
    version: '1',
    format: 'json',
    coordType: 'WGS84GEO',
    addressType: 'A10',
    lon: String(lng),
    lat: String(lat),
  });

  const response = await fetch(
    `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        appKey,
      },
      signal,
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as ReverseGeocodingResponse;
  return formatRegionAddress(data.addressInfo);
}
