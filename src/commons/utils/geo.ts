import type { ReferenceLocation, Route } from '@/commons/types/runroute';

type Coordinate = {
  lat: number;
  lng: number;
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

export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}

export function hasValidRouteStartCoordinate(
  route: Pick<Route, 'start_lat' | 'start_lng'>,
): boolean {
  return isValidCoordinate(route.start_lat, route.start_lng);
}

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
