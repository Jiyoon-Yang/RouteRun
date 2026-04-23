'use client';

import { useEffect, useState } from 'react';

import type { Route } from '@/commons/types/runroute';
import { supabase } from '@/lib/supabase/initialize';

type UseRoutesResult = {
  routes: Route[];
  isLoading: boolean;
  errorMessage: string | null;
};

type RouteRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  distance_meters: number | null;
  path_data: Record<string, unknown> | null;
  start_lat: number | null;
  start_lng: number | null;
  image_urls: string[] | null;
  likes_count: number | null;
  created_at: string | null;
};

// [정규화] DB 응답을 앱 Route 타입으로 변환
function toRoute(row: RouteRow): Route | null {
  if (
    !row.id ||
    !row.user_id ||
    !row.title ||
    row.distance_meters === null ||
    row.start_lat === null ||
    row.start_lng === null ||
    !row.created_at
  ) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    distance_meters: row.distance_meters,
    path_data: row.path_data ?? {},
    start_lat: row.start_lat,
    start_lng: row.start_lng,
    image_urls: row.image_urls ?? [],
    likes_count: row.likes_count ?? 0,
    created_at: row.created_at,
  };
}

export function useRoutes(): UseRoutesResult {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // [조회] 코스 목록 요청 및 상태 갱신 처리
    const loadRoutes = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data, error } = await supabase
          .from('routes')
          .select(
            'id, user_id, title, description, distance_meters, path_data, start_lat, start_lng, image_urls, likes_count, created_at',
          )
          .returns<RouteRow[]>();

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        const normalized = (data ?? [])
          .map(toRoute)
          .filter((route): route is Route => route !== null);
        setRoutes(normalized);
      } catch (error) {
        // [오류] 조회 실패 메시지 상태 반영
        if (!isMounted) return;
        console.error('코스 조회 실패:', error);
        setErrorMessage('코스 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRoutes();

    return () => {
      // [정리] 언마운트 이후 상태 업데이트 방지
      isMounted = false;
    };
  }, []);

  return { routes, isLoading, errorMessage };
}
