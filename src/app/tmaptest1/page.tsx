'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface TmapLatLng {
  lat(): number;
  lng(): number;
}

interface TmapMapElement {
  setMap(map: TmapMapInstance | null): void;
}

interface TmapLatLngBounds {
  extend(latlng: TmapLatLng): void;
}

interface TmapMapInstance {
  panToBounds(bounds: TmapLatLngBounds): void;
}

interface TmapV2SDK {
  Map: new (id: string, options: Record<string, unknown>) => TmapMapInstance;
  LatLng: new (lat: number, lng: number) => TmapLatLng;
  LatLngBounds: new () => TmapLatLngBounds;
  Marker: new (options: Record<string, unknown>) => TmapMapElement;
  Polyline: new (options: Record<string, unknown>) => TmapMapElement;
  Size: new (width: number, height: number) => Record<string, unknown>;
}

declare global {
  interface Window {
    Tmapv2: TmapV2SDK;
  }
}

interface Waypoint {
  lat: number;
  lng: number;
}

interface PathData {
  start: Waypoint;
  end: Waypoint;
  waypoints: Waypoint[];
}

interface Route {
  title: string;
  description: string;
  distance_meters: number;
  path_data: PathData;
  image_urls: string[];
  created_at: string;
}

interface TmapRouteFeature {
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

export default function RouteDetail() {
  const mapInstance = useRef<TmapMapInstance | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [tmapReady, setTmapReady] = useState(false);
  const elementsRef = useRef<TmapMapElement[]>([]);
  const tmapAppKey = process.env.NEXT_PUBLIC_TMAP_API_KEY ?? '';

  useEffect(() => {
    if (window.Tmapv2?.Map) {
      setTmapReady(true);
    }
  }, []);

  useEffect(() => {
    const data = localStorage.getItem('runRoutes');
    if (data) {
      const parsed = JSON.parse(data) as Route[];
      const targetRoute = parsed[parsed.length - 1];
      setRoute(targetRoute);
    }
  }, []);

  useEffect(() => {
    if (!route || !tmapReady || mapInstance.current) return;

    const { path_data } = route;
    const { start, end, waypoints } = path_data;

    const map = new window.Tmapv2.Map('map_div', {
      center: new window.Tmapv2.LatLng(start.lat, start.lng),
      width: '100%',
      height: '450px',
      zoom: 15,
    });
    mapInstance.current = map;

    const drawRoute = async () => {
      const passList = waypoints.map((wp: Waypoint) => `${wp.lng},${wp.lat}`).join('_');

      try {
        if (!tmapAppKey) {
          alert(
            'T맵 API 키가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_TMAP_API_KEY를 확인하세요.',
          );
          return;
        }
        const response = await fetch(
          'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              appKey: tmapAppKey,
            },
            body: JSON.stringify({
              startX: start.lng,
              startY: start.lat,
              endX: end.lng,
              endY: end.lat,
              startName: '출발지',
              endName: '도착지',
              passList: passList || undefined,
              reqCoordType: 'WGS84GEO',
              resCoordType: 'WGS84GEO',
            }),
          },
        );

        const data = (await response.json()) as { features: TmapRouteFeature[] };

        elementsRef.current.forEach((el) => el.setMap(null));
        elementsRef.current = [];

        const path: TmapLatLng[] = [];

        if (data.features) {
          data.features.forEach((feature: TmapRouteFeature) => {
            if (feature.geometry.type === 'LineString') {
              feature.geometry.coordinates.forEach((coord: [number, number]) => {
                path.push(new window.Tmapv2.LatLng(coord[1], coord[0]));
              });
            }
          });
        }

        const polyline = new window.Tmapv2.Polyline({
          path: path,
          strokeColor: '#FF0000',
          strokeWeight: 6,
          map: mapInstance.current,
        });
        elementsRef.current.push(polyline);

        const markerS = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(start.lat, start.lng),
          icon: 'https://tmapapi.tmapmobility.com/upload/tmap/marker/pin_r_m_s.png',
          iconSize: new window.Tmapv2.Size(24, 38),
          map: mapInstance.current,
        });
        elementsRef.current.push(markerS);

        const markerE = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(end.lat, end.lng),
          icon: 'https://tmapapi.tmapmobility.com/upload/tmap/marker/pin_r_m_e.png',
          iconSize: new window.Tmapv2.Size(24, 38),
          map: mapInstance.current,
        });
        elementsRef.current.push(markerE);

        waypoints.forEach((wp: Waypoint, index: number) => {
          const markerP = new window.Tmapv2.Marker({
            position: new window.Tmapv2.LatLng(wp.lat, wp.lng),
            map: mapInstance.current,
            label: `<span style="background-color: white; padding: 2px 5px; border: 1px solid black; border-radius: 3px; color: black; font-weight: bold; font-size: 14px;">${
              index + 1
            }</span>`,
          });
          elementsRef.current.push(markerP);
        });

        if (path.length > 0) {
          const bounds = new window.Tmapv2.LatLngBounds();
          path.forEach((p) => bounds.extend(p));
          mapInstance.current.panToBounds(bounds);
        }
      } catch (error) {
        console.error('API 요청 실패:', error);
      }
    };

    drawRoute();
  }, [route, tmapReady, tmapAppKey]);

  if (!route)
    return <div className="p-10 text-center text-black font-bold">데이터를 찾는 중...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-4 text-black bg-white min-h-screen">
      <h2 className="text-2xl font-bold text-center">러닝 코스 상세</h2>

      <div id="map_div" className="w-full border rounded-lg overflow-hidden shadow-sm" />

      <div className="p-5 border rounded-xl bg-white shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-bold text-gray-700">측정 거리</span>
          <span className="text-2xl font-black text-blue-600">
            {route.distance_meters ? (route.distance_meters / 1000).toFixed(2) : '- '} km
          </span>
        </div>

        <div>
          <h3 className="text-gray-500 font-bold text-sm mb-1">코스 제목</h3>
          <p className="p-3 bg-gray-50 border rounded-lg font-medium">{route.title}</p>
        </div>

        <div>
          <h3 className="text-gray-500 font-bold text-sm mb-1">코스 설명</h3>
          <div className="p-3 bg-gray-50 border rounded-lg min-h-[6rem] whitespace-pre-wrap text-gray-700">
            {route.description || '설명이 없습니다.'}
          </div>
        </div>

        {route.image_urls && route.image_urls.length > 0 && (
          <div>
            <h3 className="text-gray-500 font-bold text-sm mb-2">코스 사진</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {route.image_urls.map((img: string, i: number) => (
                <Image
                  key={i}
                  src={img}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover rounded-lg border shadow-sm flex-shrink-0"
                  alt={`코스사진 ${i + 1}`}
                  unoptimized
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => window.history.back()}
          className="w-full py-4 mt-2 bg-gray-800 text-white rounded-lg font-bold text-lg hover:bg-black transition-colors"
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}
