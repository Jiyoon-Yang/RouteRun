"use client";

import Script from "next/script";
import { useRef, useState, useEffect } from "react";

/** 카카오맵 클릭 이벤트에서 전달되는 객체 타입 (위도·경도 조회용) */
interface KakaoClickMouseEvent {
  latLng: { getLat(): number; getLng(): number };
}

/* ============================================
 * 타입 정의
 * ============================================ */

/** 지도에서 클릭한 한 개의 좌표 */
interface ClickPoint {
  latitude: number;
  longitude: number;
}

/** Supabase 코스 포인트 테이블에 넣을 한 행의 형태 (id는 DB에서 자동 생성되므로 제외) */
export interface SupabaseCoursePointRow {
  course_id: string;
  point_type: "START" | "WAYPOINT" | "END";
  latitude: number;
  longitude: number;
  sequence: number;
}

/* ============================================
 * Supabase 테이블 형식 변환 함수
 * ============================================
 * 요구 테이블 구조:
 * - id: uuid (자동 생성) → insert 시 제외
 * - course_id: uuid
 * - point_type: text (START / WAYPOINT / END)
 * - latitude: float8
 * - longitude: float8
 * - sequence: int4 (클릭 순서, 1부터)
 *
 * 규칙: 첫 번째 클릭 = START, 마지막 = END, 그 사이 = WAYPOINT
 */
function toSupabaseCoursePoints(
  courseId: string,
  points: ClickPoint[]
): SupabaseCoursePointRow[] {
  return points.map((point, index) => {
    const sequence = index + 1;
    const isFirst = sequence === 1;
    const isLast = sequence === points.length;
    let point_type: "START" | "WAYPOINT" | "END" = "WAYPOINT";
    if (isFirst) point_type = "START";
    else if (isLast) point_type = "END";

    return {
      course_id: courseId,
      point_type,
      latitude: point.latitude,
      longitude: point.longitude,
      sequence,
    };
  });
}

/* ============================================
 * MapTest 컴포넌트
 * ============================================
 * - 카카오맵을 띄우고, 클릭할 때마다 해당 지점의 위도/경도를 콘솔에 출력합니다.
 * - 클릭된 좌표를 순서대로 배열에 담고, Supabase 테이블 형식으로 변환하는 로직을 포함합니다.
 */
export default function MapTest() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [points, setPoints] = useState<ClickPoint[]>([]);
  /** 테스트용 course_id (실제 저장 시에는 코스 생성 후 받은 uuid 사용) */
  const [courseId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "test-course-id"
  );
  const mapRef = useRef<object | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const polylineRef = useRef<object | null>(null);
  const markersRef = useRef<object[]>([]);
  const pointsRef = useRef<ClickPoint[]>([]);
  pointsRef.current = points;

  /* 스크립트가 로드된 뒤에만 지도를 만들 수 있습니다.
   * autoload=false 로 넣었기 때문에, 스크립트만 로드되고 지도는 자동으로 안 뜹니다.
   * 우리가 원할 때 kakao.maps.load() 를 호출해서 그다음에 지도를 생성합니다. */
  useEffect(() => {
    if (!scriptLoaded || typeof window === "undefined" || !window.kakao) return;
    if (!mapContainerRef.current) return;

    const kakao = window.kakao;
    kakao.maps.load(() => {
      const container = mapContainerRef.current;
      if (!container) return;

      /* 지도 중심: 서울역 근처. level 숫자가 작을수록 확대됩니다. */
      const options = {
        center: new kakao.maps.LatLng(37.5563, 126.9723),
        level: 5,
      };
      const map = new kakao.maps.Map(container, options);
      mapRef.current = map;
      setMapReady(true);

      /* 지도 클릭: 해당 좌표 추가. 단, 출발지와 같은 위치 클릭은 마커에서 처리하므로 스킵 */
      kakao.maps.event.addListener(map, "click", (mouseEvent?: KakaoClickMouseEvent) => {
        if (!mouseEvent) return;
        const latLng = mouseEvent.latLng;
        const latitude = latLng.getLat();
        const longitude = latLng.getLng();
        const prev = pointsRef.current;
        const epsilon = 0.0001;
        if (
          prev.length >= 1 &&
          Math.abs(prev[0].latitude - latitude) < epsilon &&
          Math.abs(prev[0].longitude - longitude) < epsilon
        ) {
          return;
        }
        console.log("클릭한 좌표 — 위도(latitude):", latitude, ", 경도(longitude):", longitude);
        setPoints((p) => [...p, { latitude, longitude }]);
      });
    });
  }, [scriptLoaded]);

  /* points 변경 시: 기존 선·마커 제거 후, 순서대로 선(폴리라인)과 마커 다시 그림. 출발지 마커는 호버 시 진하게, 클릭 시 도착지로 같은 좌표 추가 */
  useEffect(() => {
    if (!mapReady || !mapRef.current || typeof window === "undefined" || !window.kakao) return;
    const map = mapRef.current as InstanceType<typeof window.kakao.maps.Map>;
    const kakao = window.kakao;

    if (polylineRef.current) {
      (polylineRef.current as { setMap: (m: object | null) => void }).setMap(null);
      polylineRef.current = null;
    }
    (markersRef.current as { setMap: (m: object | null) => void }[]).forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (points.length === 0) return;

    if (points.length >= 2) {
      const path = points.map((p) => new kakao.maps.LatLng(p.latitude, p.longitude));
      const polyline = new kakao.maps.Polyline({
        path,
        strokeWeight: 4,
        strokeColor: "#000000",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });
      polyline.setMap(map);
      polylineRef.current = polyline;
    }

    points.forEach((point, index) => {
      const position = new kakao.maps.LatLng(point.latitude, point.longitude);
      const marker = new kakao.maps.Marker({ position, map });
      if (index === 0) {
        marker.setOpacity(0.85);
        kakao.maps.event.addListener(marker, "mouseover", () => marker.setOpacity(1));
        kakao.maps.event.addListener(marker, "mouseout", () => marker.setOpacity(0.85));
        kakao.maps.event.addListener(marker, "click", () => {
          const start = points[0];
          console.log("출발지 클릭 — 도착지를 같은 위치로 추가:", start.latitude, start.longitude);
          setPoints((prev) => [...prev, { latitude: start.latitude, longitude: start.longitude }]);
        });
      }
      markersRef.current.push(marker);
    });
  }, [points, mapReady]);

  /* points가 바뀔 때마다 Supabase 형으로 변환한 결과를 콘솔에 출력 (API 응답 구조 파악용) */
  useEffect(() => {
    if (points.length === 0) return;
    const rows = toSupabaseCoursePoints(courseId, points);
    console.log("Supabase 저장용 데이터 (course_points):", rows);
  }, [points, courseId]);

  const supabaseRows = toSupabaseCoursePoints(courseId, points);

  return (
    <>
      {/* 카카오맵 JavaScript SDK를 불러옵니다.
       * appkey는 .env의 NEXT_PUBLIC_KAKAO_MAP_API_KEY 사용 (브라우저에서 접근 가능).
       * autoload=false 로 두면 kakao.maps.load() 호출 후 지도를 생성합니다. */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? ""}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-2 text-xl font-semibold text-black">
          코스 등록 테스트 (카카오맵)
        </h1>
        <p className="mb-4 text-sm text-neutral-600">
          지도를 클릭해 출발지 → 경유지 → 도착지를 순서대로 찍으세요. 선으로 연결됩니다. 도착지를 출발지와 같은 위치로 하려면 출발지 마커에 마우스를 올리면(색이 진해짐) 그 상태에서 클릭하세요.
        </p>

        {/* 지도가 들어갈 영역. ref로 DOM을 잡아서 카카오맵 API에 넘깁니다. */}
        <div
          ref={mapContainerRef}
          className="h-[60vh] w-full border border-neutral-200 bg-neutral-100"
        />

        {/* 클릭된 좌표 목록 (블랙 앤 화이트, 심플) */}
        <div className="mt-4 border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-black">
            클릭한 좌표 ({points.length}개)
          </h2>
          {points.length === 0 ? (
            <p className="text-sm text-neutral-500">지도를 클릭해 보세요.</p>
          ) : (
            <ul className="space-y-1 text-sm text-neutral-700">
              {supabaseRows.map((row, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-mono text-black">
                    [{row.sequence}] {row.point_type}
                  </span>
                  <span>
                    위도 {row.latitude.toFixed(6)}, 경도 {row.longitude.toFixed(6)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
