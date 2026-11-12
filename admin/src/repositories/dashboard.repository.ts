import type { SupabaseClient } from "@supabase/supabase-js"

export type ContentTable = "routes" | "tracks"

export type RecentContentRow = {
  id: string
  user_id: string
  title: string
  start_address_region: string | null
  likes_count: number | null
  created_at: string
}

export type AuthorRow = {
  id: string
  nickname: string | null
  is_anonymous: boolean
  profile_image_url: string | null
}

/** 행은 받지 않고 개수만 센다. `since`가 있으면 그 시각 이후 `created_at`만. */
export async function countRows(
  supabase: SupabaseClient,
  table: string,
  {
    since,
    isAnonymous,
    isHidden,
  }: { since?: string; isAnonymous?: boolean; isHidden?: boolean } = {}
): Promise<number> {
  let query = supabase.from(table).select("*", { count: "exact", head: true })
  if (since) query = query.gte("created_at", since)
  if (isAnonymous !== undefined) query = query.eq("is_anonymous", isAnonymous)
  if (isHidden !== undefined) query = query.eq("is_hidden", isHidden)

  const { count, error } = await query

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return count ?? 0
}

// shortcut: PostgREST 기본 1000행 제한, 기간 내 가입이 1000명을 넘으면 집계 RPC로 바꾼다
export async function fetchSignupsSince(
  supabase: SupabaseClient,
  since: string
): Promise<{ created_at: string; is_anonymous: boolean }[]> {
  const { data, error } = await supabase
    .from("users")
    .select("created_at, is_anonymous")
    .gte("created_at", since)

  if (error) {
    throw new Error(`users: ${error.message}`)
  }

  return data
}

// shortcut: PostgREST 기본 1000행 제한, 글이 1000개를 넘으면 집계 RPC로 바꾼다
export async function fetchRegions(
  supabase: SupabaseClient,
  table: ContentTable,
  { includeHidden = false }: { includeHidden?: boolean } = {}
): Promise<string[]> {
  let query = supabase
    .from(table)
    .select("start_address_region")
    .not("start_address_region", "is", null)
  if (!includeHidden) query = query.eq("is_hidden", false)

  const { data, error } = await query

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return data.map((row) => row.start_address_region as string)
}

export async function fetchRecentContents(
  supabase: SupabaseClient,
  table: ContentTable,
  limit: number
): Promise<RecentContentRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select("id, user_id, title, start_address_region, likes_count, created_at")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return data
}

export async function fetchAuthors(
  supabase: SupabaseClient,
  ids: string[]
): Promise<AuthorRow[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, nickname, is_anonymous, profile_image_url")
    .in("id", ids)

  if (error) {
    throw new Error(`users: ${error.message}`)
  }

  return data
}
