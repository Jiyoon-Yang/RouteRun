/**
 * Course Detail Repository — 코스 상세 페이지 데이터 통신 전담
 * - Supabase로 `routes` 테이블에서 코스를 조회한다.
 */
import type { Route } from '@/commons/types/routerun';

import { ROUTE_SELECT, toRoute, type RouteRow } from './route-row';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * `routes` 테이블에서 코스 id로 단건 조회한다.
 */
export async function getRouteById(
  supabase: SupabaseClient,
  routeId: string,
): Promise<{ data: Route | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('routes')
    .select(ROUTE_SELECT)
    .eq('id', routeId)
    .maybeSingle<RouteRow>();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: toRoute(data ?? null), error: null };
}
