export type TmapCoordinate = {
  lat: number;
  lng: number;
};

export type TmapLatLngLike = {
  lat?: (() => number) | number;
  lng?: (() => number) | number;
  _lat?: number;
  _lng?: number;
  latValue?: number;
  lngValue?: number;
};

export type TmapMapLike = {
  setCenter: (center: TmapLatLngLike) => void;
};

export type TmapMarkerLike = {
  setMap: (map: TmapMapLike | null) => void;
};

export type TmapPolylineLike = {
  setMap: (map: TmapMapLike | null) => void;
};

export type TmapPointLike = {
  _type?: string;
  _geometryType?: string;
  geometry?: {
    type?: string;
    coordinates?: number[][] | number[][][];
  };
  _latLng?: TmapLatLngLike;
  latLng?: TmapLatLngLike;
};

export type TmapV2 = {
  Map: new (
    id: string,
    options: {
      center: TmapLatLngLike;
      width: string;
      height: string;
      zoom: number;
      zoomControl?: boolean;
      scrollwheel?: boolean;
    },
  ) => TmapMapLike;
  LatLng: new (lat: number, lng: number) => TmapLatLngLike;
  Size: new (width: number, height: number) => unknown;
  Marker: new (options: Record<string, unknown>) => TmapMarkerLike;
  Polyline: new (options: Record<string, unknown>) => TmapPolylineLike;
  event?: {
    addListener?: (
      target: object,
      eventName: string,
      callback: (event?: TmapPointLike) => void,
    ) => void;
  };
  Event?: {
    addListener?: (
      target: object,
      eventName: string,
      callback: (event?: TmapPointLike) => void,
    ) => void;
  };
};

export type TmapPedestrianRouteFeature = {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[][] | number[][][];
  };
  properties: {
    totalDistance?: number;
    [key: string]: unknown;
  };
};

export type TmapPedestrianRouteResponse = {
  type: 'FeatureCollection';
  features: TmapPedestrianRouteFeature[];
};

declare global {
  interface Window {
    Tmapv2?: TmapV2;
  }
}

export {};
