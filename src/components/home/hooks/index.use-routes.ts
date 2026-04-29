'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Route } from '@/commons/types/runroute';
import { createClient } from '@/lib/supabase/client';

type UseRoutesResult = {
  routes: Route[];
  isLoading: boolean;
  errorMessage: string | null;
};

export type RouteViewport = {
  northEastLat: number;
  northEastLng: number;
  southWestLat: number;
  southWestLng: number;
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
  start_address_region: string | null;
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
    start_address_region: row.start_address_region,
    image_urls: row.image_urls ?? [],
    likes_count: row.likes_count ?? 0,
    created_at: row.created_at,
  };
}

export function useRoutes(viewport: RouteViewport | null): UseRoutesResult {
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // [조회] 코스 목록 요청 및 상태 갱신 처리
    const loadRoutes = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('routes')
          .select(
            'id, user_id, title, description, distance_meters, path_data, start_lat, start_lng, start_address_region, image_urls, likes_count, created_at',
          )
          .returns<RouteRow[]>();

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        const normalized = (data ?? [])
          .map(toRoute)
          .filter((route): route is Route => route !== null);
        setAllRoutes(normalized);
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

  const routes = useMemo(() => {
    if (!viewport) {
      return allRoutes;
    }

    const { northEastLat, northEastLng, southWestLat, southWestLng } = viewport;
    const values = [northEastLat, northEastLng, southWestLat, southWestLng];
    const hasInvalidViewport = values.some((value) => !Number.isFinite(value));
    if (hasInvalidViewport) {
      return allRoutes;
    }

    // SDK/브라우저 조합에 따라 bounds 축이 역전되어 들어오는 케이스를 보정한다.
    const minLat = Math.min(northEastLat, southWestLat);
    const maxLat = Math.max(northEastLat, southWestLat);
    const minLng = Math.min(northEastLng, southWestLng);
    const maxLng = Math.max(northEastLng, southWestLng);

    return allRoutes.filter((route) => {
      return (
        route.start_lat >= minLat &&
        route.start_lat <= maxLat &&
        route.start_lng >= minLng &&
        route.start_lng <= maxLng
      );
    });
  }, [allRoutes, viewport]);

  return { routes, isLoading, errorMessage };
}
