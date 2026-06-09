import { SEOUL_CITY_HALL_COORDINATE } from '@/commons/utils/geo';

export const DEFAULT_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 6000,
  maximumAge: 15000,
};

// 권한 다이얼로그 응답 전에 타임아웃이 터지지 않도록 timeout을 두지 않는다.
// 지도가 이미 기본 위치로 표시된 상태에서 위치를 수동 보정할 때 사용한다.
export const PASSIVE_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 0,
};

export const PRECISE_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export function getCurrentPositionWithFallback(
  onSuccess: (lat: number, lng: number) => void,
  options: PositionOptions = DEFAULT_GEOLOCATION_OPTIONS,
): void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    onSuccess(SEOUL_CITY_HALL_COORDINATE.lat, SEOUL_CITY_HALL_COORDINATE.lng);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess(position.coords.latitude, position.coords.longitude);
    },
    () => {
      onSuccess(SEOUL_CITY_HALL_COORDINATE.lat, SEOUL_CITY_HALL_COORDINATE.lng);
    },
    options,
  );
}
