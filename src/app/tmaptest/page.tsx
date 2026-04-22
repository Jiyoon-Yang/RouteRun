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

interface TmapMapInstance {
  addListener(event: string, handler: (evt: { latLng: TmapLatLng }) => void): void;
}

interface TmapV2SDK {
  Map: new (id: string, options: Record<string, unknown>) => TmapMapInstance;
  LatLng: new (lat: number, lng: number) => TmapLatLng;
  Marker: new (options: Record<string, unknown>) => TmapMapElement;
  Polyline: new (options: Record<string, unknown>) => TmapMapElement;
}

declare global {
  interface Window {
    Tmapv2: TmapV2SDK;
  }
}

interface Coord {
  lat: number;
  lng: number;
}

interface TmapRouteFeature {
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  properties: {
    totalDistance?: number;
  };
}

export default function RunRouteMap() {
  const mapInstance = useRef<TmapMapInstance | null>(null);
  const markers = useRef<TmapMapElement[]>([]);
  const polylines = useRef<TmapMapElement[]>([]);

  const [coords, setCoords] = useState<Coord[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const tmapAppKey = process.env.NEXT_PUBLIC_TMAP_API_KEY ?? '';

  useEffect(() => {
    if (window.Tmapv2 && !mapInstance.current) {
      const map = new window.Tmapv2.Map('map_div', {
        center: new window.Tmapv2.LatLng(37.5664816, 126.985023),
        width: '100%',
        height: '400px',
        zoom: 15,
      });
      mapInstance.current = map;

      map.addListener('click', (evt: { latLng: TmapLatLng }) => {
        const latlng = evt.latLng;
        setCoords((prev) => {
          if (prev.length >= 7) {
            alert('포인트는 최대 7개까지만 설정 가능합니다.');
            return prev;
          }
          const newMarker = new window.Tmapv2.Marker({
            position: latlng,
            map: map,
            label: `<span style="background-color: white; padding: 2px; border: 1px solid black; color: black;">${
              prev.length + 1
            }</span>`,
          });
          markers.current.push(newMarker);
          return [...prev, { lat: latlng.lat(), lng: latlng.lng() }];
        });
      });
    }
  }, []);

  const calculateRoute = async () => {
    if (!tmapAppKey) {
      alert(
        'T맵 API 키가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_TMAP_API_KEY를 확인하세요.',
      );
      return;
    }
    if (coords.length < 2) {
      alert('출발지와 도착지를 지도에 찍어주세요.');
      return;
    }
    const start = coords[0];
    const end = coords[coords.length - 1];
    const waypoints = coords.slice(1, -1);
    const passList = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join('_');

    try {
      const response = await fetch(
        'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', appKey: tmapAppKey },
          body: JSON.stringify({
            startX: start.lng,
            startY: start.lat,
            endX: end.lng,
            endY: end.lat,
            startName: '출발',
            endName: '도착',
            passList: passList || undefined,
            reqCoordType: 'WGS84GEO',
            resCoordType: 'WGS84GEO',
          }),
        },
      );
      const data = (await response.json()) as { features: TmapRouteFeature[] };
      if (data.features) {
        setDistance(data.features[0].properties.totalDistance ?? null);
        polylines.current.forEach((l) => l.setMap(null));
        const path: TmapLatLng[] = [];
        data.features.forEach((f: TmapRouteFeature) => {
          if (f.geometry.type === 'LineString') {
            f.geometry.coordinates.forEach((c: [number, number]) =>
              path.push(new window.Tmapv2.LatLng(c[1], c[0])),
            );
          }
        });
        const line = new window.Tmapv2.Polyline({
          path,
          strokeColor: '#FF0000',
          strokeWeight: 6,
          map: mapInstance.current,
        });
        polylines.current.push(line);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) return alert('최대 5장까지 가능합니다.');
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    if (distance === null || !title) return alert('경로 계산과 제목 입력이 필요합니다.');

    const newRoute = {
      id: Date.now().toString(),
      title,
      description,
      distance_meters: Math.floor(distance),
      path_data: {
        start: coords[0],
        end: coords[coords.length - 1],
        waypoints: coords.slice(1, -1),
      },
      start_lat: coords[0].lat,
      start_lng: coords[0].lng,
      image_urls: images,
      created_at: new Date().toISOString(),
    };

    const prev = JSON.parse(localStorage.getItem('runRoutes') || '[]');
    try {
      localStorage.setItem('runRoutes', JSON.stringify([...prev, newRoute]));
      alert('등록 완료!');
    } catch {
      alert('저장 공간 부족 (이미지 용량을 줄여주세요)');
    }
  };

  const resetMap = () => {
    markers.current.forEach((m) => m.setMap(null));
    polylines.current.forEach((l) => l.setMap(null));
    markers.current = [];
    polylines.current = [];
    setCoords([]);
    setDistance(null);
    setTitle('');
    setDescription('');
    setImages([]);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto flex flex-col gap-4 text-black">
      <h2 className="text-2xl font-bold text-center">러닝 코스 등록</h2>

      <div id="map_div" className="w-full border rounded-lg overflow-hidden" />
      <div className="flex gap-2">
        <button
          onClick={calculateRoute}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold"
        >
          경로 계산하기
        </button>
        <button onClick={resetMap} className="px-4 py-3 bg-gray-200 rounded-lg font-bold">
          초기화
        </button>
      </div>

      <div className="p-5 border rounded-xl bg-white shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-bold text-gray-700">측정 거리</span>
          <span className="text-2xl font-black text-blue-600">
            {distance ? (distance / 1000).toFixed(2) : '- '} km
          </span>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="코스 제목"
          className="p-3 border rounded-lg text-black w-full"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="코스 설명"
          className="p-3 border rounded-lg text-black w-full h-24"
        />
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="text-sm text-gray-500"
        />
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <Image
              key={i}
              src={img}
              width={80}
              height={80}
              className="w-20 h-20 object-cover rounded border"
              alt="preview"
              unoptimized
            />
          ))}
        </div>
        <button
          onClick={handleSave}
          className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg"
        >
          코스 등록하기
        </button>
      </div>
    </div>
  );
}
