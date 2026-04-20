'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Tmapv2: any;
  }
}

export default function RouteDetail() {
  const mapInstance = useRef<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [tmapReady, setTmapReady] = useState(false);
  const elementsRef = useRef<any[]>([]); // 라인과 마커들을 관리 (초기화용)
  const tmapAppKey = process.env.NEXT_PUBLIC_TMAP_API_KEY ?? '';

  // layout.tsx의 동기 <script>로 로드되므로 useEffect 시점엔 SDK가 준비되어 있어야 함
  // 안전을 위해 Map 생성자 존재 여부로 준비 확인
  useEffect(() => {
    if (window.Tmapv2?.Map) {
      setTmapReady(true);
    }
  }, []);

  useEffect(() => {
    // 1. 로컬스토리지에서 데이터 가져오기 (가장 최근 등록된 코스 기준)
    // 실제 서비스에서는 URL의 ID값을 기반으로 찾게 됩니다.
    const data = localStorage.getItem('runRoutes');
    if (data) {
      const parsed = JSON.parse(data);
      // 가장 마지막에 등록된 데이터 선택
      const targetRoute = parsed[parsed.length - 1];
      setRoute(targetRoute);
    }
  }, []);

  useEffect(() => {
    // 2. 지도 초기화 및 경로 그리기 — tmapReady로 SDK 완전 로드 확인
    if (route && tmapReady && !mapInstance.current) {
      const { path_data } = route;
      const { start } = path_data;

      const map = new window.Tmapv2.Map('map_div', {
        center: new window.Tmapv2.LatLng(start.lat, start.lng),
        width: '100%',
        height: '450px',
        zoom: 15,
      });
      mapInstance.current = map;
      drawRouteAndMarkers();
    }
  }, [route, tmapReady]);

  const drawRouteAndMarkers = async () => {
    if (!route) return;

    // 수파베이스 구조와 동일한 path_data에서 좌표 추출
    const { path_data } = route;
    const { start, end, waypoints } = path_data;

    const passList = waypoints.map((wp: any) => `${wp.lng},${wp.lat}`).join('_');

    try {
      if (!tmapAppKey) {
        alert(
          'T맵 API 키가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_TMAP_API_KEY를 확인하세요.',
        );
        return;
      }
      // 3. Tmap API (보행자 경로) 호출
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

      const data = await response.json();

      // 기존 요소 초기화
      elementsRef.current.forEach((el) => el.setMap(null));
      elementsRef.current = [];

      const path: any[] = [];

      // 4. 경로 좌표 생성
      if (data.features) {
        data.features.forEach((feature: any) => {
          if (feature.geometry.type === 'LineString') {
            feature.geometry.coordinates.forEach((coord: any) => {
              path.push(new window.Tmapv2.LatLng(coord[1], coord[0]));
            });
          }
        });
      }

      // 5. 경로(빨간 선) 그리기
      const polyline = new window.Tmapv2.Polyline({
        path: path,
        strokeColor: '#FF0000',
        strokeWeight: 6,
        map: mapInstance.current,
      });
      elementsRef.current.push(polyline);

      // 📍 6. 마커 그리기

      // [출발지]
      const markerS = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(start.lat, start.lng),
        icon: 'https://tmapapi.tmapmobility.com/upload/tmap/marker/pin_r_m_s.png',
        iconSize: new window.Tmapv2.Size(24, 38),
        map: mapInstance.current,
      });
      elementsRef.current.push(markerS);

      // [도착지]
      const markerE = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(end.lat, end.lng),
        icon: 'https://tmapapi.tmapmobility.com/upload/tmap/marker/pin_r_m_e.png',
        iconSize: new window.Tmapv2.Size(24, 38),
        map: mapInstance.current,
      });
      elementsRef.current.push(markerE);

      // [경유지]
      waypoints.forEach((wp: any, index: number) => {
        const markerP = new window.Tmapv2.Marker({
          position: new window.Tmapv2.LatLng(wp.lat, wp.lng),
          map: mapInstance.current,
          label: `<span style="background-color: white; padding: 2px 5px; border: 1px solid black; border-radius: 3px; color: black; font-weight: bold; font-size: 14px;">${
            index + 1
          }</span>`,
        });
        elementsRef.current.push(markerP);
      });

      // 7. 전체 경로에 맞춰 카메라 이동
      if (path.length > 0) {
        const bounds = new window.Tmapv2.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        mapInstance.current.panToBounds(bounds);
      }
    } catch (error) {
      console.error('API 요청 실패:', error);
    }
  };

  if (!route)
    return <div className="p-10 text-center text-black font-bold">데이터를 찾는 중...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-4 text-black bg-white min-h-screen">
      <h2 className="text-2xl font-bold text-center">러닝 코스 상세</h2>

      {/* 🗺️ 지도 영역 */}
      <div id="map_div" className="w-full border rounded-lg overflow-hidden shadow-sm" />

      {/* 정보 영역 */}
      <div className="p-5 border rounded-xl bg-white shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-bold text-gray-700">측정 거리</span>
          <span className="text-2xl font-black text-blue-600">
            {/* m 단위를 km로 변환 */}
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

        {/* 📷 이미지 영역 (image_urls 사용) */}
        {route.image_urls && route.image_urls.length > 0 && (
          <div>
            <h3 className="text-gray-500 font-bold text-sm mb-2">코스 사진</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {route.image_urls.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  className="w-24 h-24 object-cover rounded-lg border shadow-sm flex-shrink-0"
                  alt={`코스사진 ${i + 1}`}
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
