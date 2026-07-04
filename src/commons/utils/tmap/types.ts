import type { DistanceCategory } from '@/commons/utils/distance/category';
import type { MarkerVisualState } from '@/commons/utils/marker/route-marker';

export type TmapLatLng = {
  lat?: (() => number) | number;
  lng?: (() => number) | number;
  _lat?: number;
  _lng?: number;
  latValue?: number;
  lngValue?: number;
};

export type TmapLatLngBoundsLike = {
  getNorthEast?: () => TmapLatLng;
  getSouthWest?: () => TmapLatLng;
};

export type TmapMap = {
  setCenter: (center: TmapLatLng) => void;
  setZoom: (zoomLevel: number, options?: Record<string, unknown>) => void;
  getZoom: () => number;
  setZoomLimit?: (minZoom: number, maxZoom: number) => void;
  getMinZoom?: () => number;
  getMaxZoom?: () => number;
  zoomIn?: () => void;
  zoomOut?: () => void;
  addListener?: (eventName: string, callback: () => void) => void;
  on?: (eventName: string, callback: () => void) => void;
  resize?: () => void;
  getBounds?: () => TmapLatLngBoundsLike | null | undefined;
  fitBounds?: (...args: unknown[]) => void;
};

export type TmapMarker = {
  setMap: (map: TmapMap | null) => void;
  setPosition: (position: TmapLatLng) => void;
  getMap?: () => TmapMap | null;
  map?: TmapMap | null;
  setIcon?: (icon: string) => void;
  addListener?: (eventName: string, callback: () => void) => void;
  on?: (eventName: string, callback: () => void) => void;
  getElement?: () => HTMLElement | null;
  getPosition?: () => TmapLatLng;
};

export type TmapPolyline = {
  setMap: (map: TmapMap | null) => void;
  getPath?: () => TmapLatLng[];
};

export type TmapMarkerCluster = {
  setMap?: (map: TmapMap | null) => void;
  clearMarkers?: () => void;
};

export type TmapV3API = {
  Map: new (id: string, options: Record<string, unknown>) => TmapMap;
  LatLng: new (lat: number, lng: number) => TmapLatLng;
  Size: new (width: number, height: number) => unknown;
  Point?: new (x: number, y: number) => unknown;
  Marker: new (options: Record<string, unknown>) => TmapMarker;
  Polyline: new (options: Record<string, unknown>) => TmapPolyline;
  extension?: {
    MarkerCluster: new (options: {
      markers: TmapMarker[];
      map: TmapMap;
      /** 클러스터로 묶는 픽셀 거리 임계값 (SDK 기본값 80) */
      gridSize?: number;
      /** 이 줌 이하에서만 클러스터링 (SDK 기본값 19) */
      maxClusterZoom?: number;
      /** 클러스터 형성 최소 마커 수 (SDK 기본값 2) */
      minClusterCount?: number;
    }) => TmapMarkerCluster;
  };
  event?: {
    addListener?: (target: TmapMarker, eventName: string, callback: () => void) => void;
  };
  Event?: {
    addListener?: (target: TmapMarker, eventName: string, callback: () => void) => void;
  };
};

export type RouteMarkerEntry = {
  marker: TmapMarker;
  category: DistanceCategory;
  visualState: MarkerVisualState;
  lat: number;
  lng: number;
  isVisible: boolean;
  outOfViewportSinceMs: number | null;
};
