'use client';

import { useCallback, useEffect, useState } from 'react';

import { createCourseAction } from '@/actions/course.action';
import { uploadCourseImages } from '@/commons/utils/storage.util';
import type { SaveRoutePayload } from '@/components/tmap/course-submit/hooks/useCourseMap';

export const MAX_COURSE_SUBMIT_IMAGES = 5;

export type UseCourseSubmitParams = {
  mode: 'new' | 'edit';
  courseId?: string;
};

export type RouteData = SaveRoutePayload;

function toPathDataRecord(data: RouteData): Record<string, unknown> {
  const detailedPath = data.pathData.path.map(({ lat, lng }) => ({ lat, lng }));
  return {
    // DB에는 도보 경로의 상세 좌표를 우선 저장한다.
    path: detailedPath,
    waypoint_points: data.pathData.points.map(({ lat, lng }) => ({ lat, lng })),
    path_source: 'pedestrianRoute.path',
  };
}

/** Tmap `saveRoute` 이후 페이로드에 시작점·거리가 모두 유효한지 확인한다. */
export function isRouteDataCompleteForSubmit(data: RouteData | null): data is RouteData {
  if (!data) return false;

  const { startPoint, totalDistanceKm, pathData } = data;

  if (!pathData?.points?.length || !pathData?.path?.length) {
    return false;
  }

  if (!startPoint || typeof startPoint.lat !== 'number' || typeof startPoint.lng !== 'number') {
    return false;
  }
  if (!Number.isFinite(startPoint.lat) || !Number.isFinite(startPoint.lng)) {
    return false;
  }

  if (typeof totalDistanceKm !== 'number' || !Number.isFinite(totalDistanceKm)) {
    return false;
  }

  return true;
}

export function useCourseSubmit({ mode, courseId }: UseCourseSubmitParams) {
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  useEffect(() => {
    if (mode !== 'edit' || !courseId) {
      return;
    }
    // TODO(edit): courseId로 기존 코스를 조회해 폼·routeData·이미지 초기값을 채운다.
  }, [mode, courseId]);

  const handleSaveRoute = useCallback((data: SaveRoutePayload) => {
    const normalized: RouteData = {
      totalDistanceKm: Number(data.totalDistanceKm),
      pathData: {
        points: data.pathData.points.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })),
        path: data.pathData.path.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })),
      },
      startPoint: {
        lat: Number(data.startPoint.lat),
        lng: Number(data.startPoint.lng),
      },
    };

    if (!isRouteDataCompleteForSubmit(normalized)) {
      console.warn('[useCourseSubmit] Tmap 경로 데이터가 불완전합니다.', data);
      return;
    }

    setRouteData(normalized);
  }, []);

  const handleImageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const remaining = MAX_COURSE_SUBMIT_IMAGES - images.length;
      const nextFiles = Array.from(files).slice(0, remaining);
      setImages((prev) => [...prev, ...nextFiles]);
      e.target.value = '';
    },
    [images.length],
  );

  const removeImageAt = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const isSubmitEnabled = courseName.trim().length > 0 && isRouteDataCompleteForSubmit(routeData);

  const handleSubmit = useCallback(async () => {
    const title = courseName.trim();
    if (!title || !isRouteDataCompleteForSubmit(routeData)) return;

    if (mode === 'edit') {
      // TODO(edit): 수정 API와 스토리지(이미지 교체) 정책에 맞춰 제출 로직을 연결한다.
      return;
    }

    try {
      const imageUrls = await uploadCourseImages(images);
      const result = await createCourseAction({
        title,
        description: description.trim() || null,
        routeData: {
          totalDistanceKm: routeData.totalDistanceKm,
          pathData: toPathDataRecord(routeData),
          startPoint: {
            lat: routeData.startPoint.lat,
            lng: routeData.startPoint.lng,
          },
        },
        imageUrls,
      });

      if (result && !result.success) {
        window.alert(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '코스 등록 중 오류가 발생했습니다.';
      window.alert(message);
    }
  }, [courseName, description, images, mode, routeData]);

  return {
    courseName,
    setCourseName,
    description,
    setDescription,
    images,
    routeData,
    handleSaveRoute,
    handleImageInputChange,
    removeImageAt,
    handleSubmit,
    isSubmitEnabled,
  };
}
