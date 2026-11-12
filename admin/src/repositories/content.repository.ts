import type { SupabaseClient } from "@supabase/supabase-js"

import type { ContentTable } from "@/repositories/dashboard.repository"

export type ContentRow = {
  id: string
  title: string
  description: string | null
  start_address_region: string | null
  distance_meters: number | null
  likes_count: number | null
  image_urls: string[] | null
  is_hidden: boolean
  created_at: string
  users: { nickname: string | null; is_anonymous: boolean } | null
}

// 경로(`path_data`)는 무거워서 받지 않는다. 좋아요 테이블을 거치는 관계도 있어서 작성자 FK(user_id)를 짚어 임베드한다.
const CONTENT_SELECT =
  "id, title, description, start_address_region, distance_meters, likes_count, image_urls, is_hidden, created_at, users!user_id(nickname, is_anonymous)"

// shortcut: PostgREST 기본 1000행 제한, 코스나 트랙이 1000개를 넘으면 서버 페이지네이션
export async function fetchContents(
  supabase: SupabaseClient,
  table: ContentTable
): Promise<ContentRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select(CONTENT_SELECT)
    .order("created_at", { ascending: false })
    // 스키마 타입이 없으면 임베드를 배열로 추론한다. 다대일 FK라 실제로는 객체 하나다.
    .overrideTypes<ContentRow[], { merge: false }>()

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return data
}

/** 숨김 여부를 바꾸고, 실제로 바뀐 행만 돌려준다. 이미 그 상태인 행은 건드리지 않는다. */
export async function updateHidden(
  supabase: SupabaseClient,
  table: ContentTable,
  ids: string[],
  isHidden: boolean
): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase
    .from(table)
    .update({ is_hidden: isHidden })
    .in("id", ids)
    .neq("is_hidden", isHidden)
    .select("id, title")

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return data
}
