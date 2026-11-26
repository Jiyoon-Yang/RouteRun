import type { SupabaseClient } from "@supabase/supabase-js"

import { USER_PAGE_SIZE } from "@/commons/constants/content"
import type { UserFilters } from "@/commons/types/admin"
import type { ContentTable } from "@/repositories/dashboard.repository"

export type UserRow = {
  id: string
  nickname: string | null
  is_anonymous: boolean
  profile_image_url: string | null
  created_at: string
}

export type UserContentRow = {
  id: string
  title: string
  start_address_region: string | null
  distance_meters: number | null
  likes_count: number | null
  is_hidden: boolean
  created_at: string
}

const USER_SELECT = "id, nickname, is_anonymous, profile_image_url, created_at"

/** 조건에 맞는 유저 한 페이지와 전체 수. 가입 최신순. */
export async function fetchUsers(
  supabase: SupabaseClient,
  { type, query, page }: UserFilters
): Promise<{ rows: UserRow[]; total: number }> {
  const filtered = (columns: string, options: { head?: boolean }) => {
    let request = supabase
      .from("users")
      .select(columns, { count: "exact", ...options })
    if (type !== "all") request = request.eq("is_anonymous", type === "guest")
    // 검색어의 %·_는 와일드카드가 아니라 글자로 찾는다.
    if (query)
      request = request.ilike(
        "nickname",
        `%${query.replace(/[\\%_]/g, "\\$&")}%`
      )
    return request
  }

  const from = (page - 1) * USER_PAGE_SIZE
  const { data, error, count } = await filtered(USER_SELECT, {})
    // 가입 시각이 같은 유저가 페이지 사이에서 겹치거나 빠지지 않게 id로 순서를 고정한다.
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + USER_PAGE_SIZE - 1)
    .overrideTypes<UserRow[], { merge: false }>()

  // 탈퇴 등으로 유저가 줄어 페이지가 범위를 벗어나면 PostgREST가 오류를 낸다. 빈 페이지와 실제 수로 돌려준다.
  if (error?.code === "PGRST103") {
    const head = await filtered("id", { head: true })
    if (!head.error) return { rows: [], total: head.count ?? 0 }
  }

  if (error) {
    throw new Error(`users: ${error.message}`)
  }

  return { rows: data, total: count ?? 0 }
}

/** 이메일·최근 로그인. `users`에는 없고 auth.users에만 있어 Auth Admin API로 읽는다. */
export async function fetchAuthUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ email: string | null; lastSignInAt: string | null }> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)

  if (error) {
    throw new Error(`auth.users: ${error.message}`)
  }

  return {
    email: data.user.email || null,
    lastSignInAt: data.user.last_sign_in_at ?? null,
  }
}

/** 숨긴 글을 포함해 유저가 쓴 최근 글 `limit`개와 전체 수. */
export async function fetchUserContents(
  supabase: SupabaseClient,
  table: ContentTable,
  userId: string,
  limit: number
): Promise<{ rows: UserContentRow[]; total: number }> {
  const { data, error, count } = await supabase
    .from(table)
    .select(
      "id, title, start_address_region, distance_meters, likes_count, is_hidden, created_at",
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return { rows: data, total: count ?? 0 }
}

/** 유저가 누른 코스·트랙 좋아요 수. */
export async function countUserLikes(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const counts = await Promise.all(
    (["route_likes", "track_likes"] as const).map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      if (error) {
        throw new Error(`${table}: ${error.message}`)
      }

      return count ?? 0
    })
  )

  return counts[0] + counts[1]
}
