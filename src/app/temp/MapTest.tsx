"use client";

import Script from "next/script";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  saveRunningCourse,
  getCourseList,
  deleteCourse,
  updateCourse,
  type CourseListItem,
} from "@/lib/supabase";

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
 * ============================================ */
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
 * ============================================ */
export default function MapTest() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [points, setPoints] = useState<ClickPoint[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [distance, setDistance] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", author: "", distance: "" });

  const mapRef = useRef<object | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const polylineRef = useRef<object | null>(null);
  const markersRef = useRef<object[]>([]);
  const pointsRef = useRef<ClickPoint[]>([]);
  pointsRef.current = points;

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const list = await getCourseList();
      setCourses(list);
    } catch (err) {
      console.error("코스 목록 조회 실패:", err);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (!scriptLoaded || typeof window === "undefined" || !window.kakao) return;
    if (!mapContainerRef.current) return;

    const kakao = window.kakao;
    kakao.maps.load(() => {
      const container = mapContainerRef.current;
      if (!container) return;

      const options = {
        center: new kakao.maps.LatLng(37.5563, 126.9723),
        level: 5,
      };
      const map = new kakao.maps.Map(container, options);
      mapRef.current = map;
      setMapReady(true);

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
        setPoints((p) => [...p, { latitude, longitude }]);
      });
    });
  }, [scriptLoaded]);

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
          setPoints((prev) => [...prev, { latitude: start.latitude, longitude: start.longitude }]);
        });
      }
      markersRef.current.push(marker);
    });
  }, [points, mapReady]);

  const handleSave = async () => {
    if (points.length === 0) {
      setSaveError("좌표를 먼저 찍어주세요.");
      return;
    }
    setSaveError(null);
    setSaveLoading(true);
    try {
      await saveRunningCourse({
        title: title || "제목 없음",
        author: author || "익명",
        distance: parseFloat(distance) || 0,
        images: [],
        points,
      });
      setPoints([]);
      setTitle("");
      setAuthor("");
      setDistance("");
      await fetchCourses();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("이 코스를 삭제하시겠습니까?")) return;
    try {
      await deleteCourse(courseId);
      await fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
    }
  };

  const handleEditStart = (course: CourseListItem) => {
    setEditingId(course.id);
    setEditForm({
      title: course.title,
      author: course.author,
      distance: String(course.distance),
    });
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    try {
      await updateCourse(editingId, {
        title: editForm.title,
        author: editForm.author,
        distance: parseFloat(editForm.distance) || 0,
      });
      setEditingId(null);
      await fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "수정 실패");
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const supabaseRows = toSupabaseCoursePoints("preview", points);

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? ""}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-2 text-xl font-semibold text-black">
          코스 등록 테스트 (카카오맵)
        </h1>
        <p className="mb-4 text-sm text-neutral-600">
          지도를 클릭해 출발지 → 경유지 → 도착지를 순서대로 찍으세요. 도착지를 출발지와 같은
          위치로 하려면 출발지 마커를 클릭하세요.
        </p>

        <div className="flex gap-6">
          {/* 왼쪽: 저장된 코스 리스트 */}
          <div className="w-80 shrink-0 border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 p-3">
              <h2 className="text-sm font-medium text-black">저장된 코스</h2>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {coursesLoading ? (
                <p className="text-sm text-neutral-500">로딩 중...</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-neutral-500">저장된 코스가 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {courses.map((course) => (
                    <li
                      key={course.id}
                      className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm"
                    >
                      {editingId === course.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="제목"
                            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                          <input
                            type="text"
                            value={editForm.author}
                            onChange={(e) => setEditForm((f) => ({ ...f, author: e.target.value }))}
                            placeholder="작성자"
                            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                          <input
                            type="text"
                            value={editForm.distance}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, distance: e.target.value }))
                            }
                            placeholder="거리(km)"
                            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleEditSave}
                              className="rounded bg-black px-2 py-1 text-xs text-white"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={handleEditCancel}
                              className="rounded border border-neutral-300 px-2 py-1 text-xs"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-black">{course.title}</p>
                          <p className="mt-0.5 text-neutral-600">
                            {course.author} · {course.distance}km
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-400">
                            {new Date(course.created_at).toLocaleString("ko-KR")}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditStart(course)}
                              className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(course.id)}
                              className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              삭제
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 오른쪽: 지도 + 좌표 + 저장 */}
          <div className="flex-1 min-w-0">
            <div
              ref={mapContainerRef}
              className="h-[50vh] w-full border border-neutral-200 bg-neutral-100"
            />

            <div className="mt-4 border border-neutral-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-medium text-black">
                클릭한 좌표 ({points.length}개)
              </h2>
              {points.length === 0 ? (
                <p className="mb-4 text-sm text-neutral-500">지도를 클릭해 보세요.</p>
              ) : (
                <ul className="mb-4 space-y-1 text-sm text-neutral-700">
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

              <div className="flex flex-wrap gap-3 gap-y-2">
                <input
                  type="text"
                  placeholder="제목"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="max-w-[200px] rounded border border-neutral-300 px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  placeholder="작성자"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="max-w-[200px] rounded border border-neutral-300 px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  placeholder="거리(km)"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="max-w-[100px] rounded border border-neutral-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading || points.length === 0}
                  className="rounded bg-black px-4 py-1 text-sm font-medium text-white disabled:bg-neutral-400"
                >
                  {saveLoading ? "저장 중..." : "저장"}
                </button>
              </div>
              {saveError && (
                <p className="mt-2 text-sm text-red-600">{saveError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
