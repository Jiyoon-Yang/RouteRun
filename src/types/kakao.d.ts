/**
 * 카카오맵 JavaScript SDK 전역 타입 선언
 * - Next.js에서 window.kakao를 사용할 때 TypeScript 오류를 막기 위한 선언입니다.
 * - SDK는 CDN 스크립트로 로드되므로, 사용하는 API만 최소한으로 선언합니다.
 */

interface KakaoMapsLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoMapsMouseEvent {
  latLng: KakaoMapsLatLng;
}

interface KakaoMapsMapOptions {
  center: KakaoMapsLatLng;
  level?: number;
}

/** 지도 인스턴스 (카카오 SDK가 제공하는 Map 객체, addListener 등에서 사용) */
type KakaoMapsMap = object;

interface KakaoMapsPolylineOptions {
  path: KakaoMapsLatLng[];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: string;
}

interface KakaoMapsMarkerOptions {
  position: KakaoMapsLatLng;
  map?: KakaoMapsMap;
}

/** 폴리라인(선) 객체 - setMap, setPath 등 */
interface KakaoMapsPolyline {
  setMap(map: KakaoMapsMap | null): void;
  setPath(path: KakaoMapsLatLng[]): void;
}

/** 마커 객체 - setMap, setOpacity, 이벤트 등 */
interface KakaoMapsMarker {
  setMap(map: KakaoMapsMap | null): void;
  setOpacity(opacity: number): void;
}

interface KakaoMapsEvent {
  addListener(
    target: KakaoMapsMap | KakaoMapsMarker,
    type: string,
    handler: (mouseEvent?: KakaoMapsMouseEvent) => void
  ): void;
}

interface KakaoMapsStatic {
  maps: {
    load(callback?: () => void): void;
    LatLng: new (lat: number, lng: number) => KakaoMapsLatLng;
    Map: new (container: HTMLElement, options: KakaoMapsMapOptions) => KakaoMapsMap;
    Polyline: new (options: KakaoMapsPolylineOptions) => KakaoMapsPolyline;
    Marker: new (options: KakaoMapsMarkerOptions) => KakaoMapsMarker;
    event: KakaoMapsEvent;
  };
}

declare global {
  interface Window {
    kakao: KakaoMapsStatic;
  }
}

export {};
