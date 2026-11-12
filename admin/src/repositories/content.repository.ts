import type { SupabaseClient } from "@supabase/supabase-js"

import { CONTENT_PAGE_SIZE, REGION_GROUPS } from "@/commons/constants/content"
import type { ContentFilters } from "@/commons/types/admin"
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

/** 조건에 맞는 글 한 페이지와 전체 개수. */
export async function fetchContents(
  supabase: SupabaseClient,
  table: ContentTable,
  { region, visibility, query, page }: Omit<ContentFilters, "kind">
): Promise<{ rows: ContentRow[]; total: number }> {
  // "all"이면 권역이 없어 거르지 않는다.
  const prefixes = REGION_GROUPS.find(
    (group) => group.label === region
  )?.prefixes

  const filtered = (columns: string, options: { head?: boolean }) => {
    let request = supabase
      .from(table)
      .select(columns, { count: "exact", ...options })
    // 권역에 속한 시·도 이름 중 하나로 시작하는 글. 이름은 고정 상수라 or 문법을 깨는 글자가 없다.
    if (prefixes)
      request = request.or(
        prefixes.map((name) => `start_address_region.like.${name}*`).join(",")
      )
    if (visibility !== "all")
      request = request.eq("is_hidden", visibility === "hidden")
    // 검색어의 %·_는 와일드카드가 아니라 글자로 찾는다.
    if (query)
      request = request.ilike("title", `%${query.replace(/[\\%_]/g, "\\$&")}%`)
    return request
  }

  const from = (page - 1) * CONTENT_PAGE_SIZE
  const { data, error, count } = await filtered(CONTENT_SELECT, {})
    // 등록 시각이 같은 글이 페이지 사이에서 겹치거나 빠지지 않게 id로 순서를 고정한다.
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + CONTENT_PAGE_SIZE - 1)
    // 스키마 타입이 없으면 임베드를 배열로 추론한다. 다대일 FK라 실제로는 객체 하나다.
    .overrideTypes<ContentRow[], { merge: false }>()

  // 숨김 해제 등으로 글이 줄어 페이지가 범위를 벗어나면 PostgREST가 오류를 낸다. 빈 페이지와 실제 개수로 돌려준다.
  if (error?.code === "PGRST103") {
    const head = await filtered("id", { head: true })
    if (!head.error) return { rows: [], total: head.count ?? 0 }
  }

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return { rows: data, total: count ?? 0 }
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
