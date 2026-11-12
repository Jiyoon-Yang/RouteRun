import type { SupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

import type { DashboardStats } from "@/commons/types/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  countRows,
  fetchAuthors,
  fetchRecentContents,
  fetchRegions,
  fetchSignupsSince,
  type RecentContentRow,
} from "@/repositories/dashboard.repository"

const DAY = 24 * 60 * 60 * 1000
const DAYS = 30
const TOP_REGIONS = 7
const RECENT = 6

// en-CA는 YYYY-MM-DD로 나온다. 서버가 UTC여도 한국 날짜로 묶는다.
const kstDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" })
const toKstDate = (time: string | number) => kstDate.format(new Date(time))

async function countTotals(supabase: SupabaseClient, since?: string) {
  const [google, guests, courses, tracks] = await Promise.all([
    countRows(supabase, "users", { since, isAnonymous: false }),
    countRows(supabase, "users", { since, isAnonymous: true }),
    countRows(supabase, "routes", { since }),
    countRows(supabase, "tracks", { since }),
  ])
  return { users: google + guests, google, guests, courses, tracks }
}

// 관리자용 집계라 10분까지는 캐시를 써서 열 때마다 쿼리 13개를 다시 돌리지 않는다.
const CACHE_TTL = 10 * 60 * 1000

const getCachedDashboardStats = unstable_cache(
  async () => ({ stats: await fetchDashboardStats(), fetchedAt: Date.now() }),
  ["dashboard-stats"],
  { revalidate: CACHE_TTL / 1000 }
)

/** 대시보드 KPI·차트·최근 등록. Service Role로 읽으므로 호출 전에 `requireAdmin()`을 거친다. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { stats, fetchedAt } = await getCachedDashboardStats()
  // unstable_cache는 만료돼도 옛 값을 먼저 주므로, 오래됐으면 기다려서 새로 받는다
  return Date.now() - fetchedAt > CACHE_TTL ? fetchDashboardStats() : stats
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient()
  const now = Date.now()

  const [
    totals,
    weekly,
    signups,
    routeRegions,
    trackRegions,
    recentRoutes,
    recentTracks,
  ] = await Promise.all([
    countTotals(supabase),
    countTotals(supabase, new Date(now - 7 * DAY).toISOString()),
    // 첫 버킷(29일 전 KST 날짜)의 0시부터 다 받도록 하루 더 넉넉히
    fetchSignupsSince(supabase, new Date(now - DAYS * DAY).toISOString()),
    fetchRegions(supabase, "routes"),
    fetchRegions(supabase, "tracks"),
    fetchRecentContents(supabase, "routes", RECENT),
    fetchRecentContents(supabase, "tracks", RECENT),
  ])

  const daily = new Map(
    Array.from({ length: DAYS }, (_, i) => {
      const date = toKstDate(now - (DAYS - 1 - i) * DAY)
      return [date, { date, signups: 0, guests: 0 }]
    })
  )
  for (const row of signups) {
    const bucket = daily.get(toKstDate(row.created_at))
    if (!bucket) continue
    if (row.is_anonymous) bucket.guests++
    else bucket.signups++
  }

  // "중구"처럼 시가 달라도 같은 구 이름이 있어서 전체 문자열로 묶는다.
  const regions = new Map<string, DashboardStats["regions"][number]>()
  const addRegions = (names: string[], key: "courses" | "tracks") => {
    for (const region of names) {
      const row = regions.get(region) ?? { region, courses: 0, tracks: 0 }
      row[key]++
      regions.set(region, row)
    }
  }
  addRegions(routeRegions, "courses")
  addRegions(trackRegions, "tracks")

  const recent = [
    ...recentRoutes.map((row) => ({ ...row, kind: "course" as const })),
    ...recentTracks.map((row) => ({ ...row, kind: "track" as const })),
  ]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, RECENT)

  return {
    totals,
    weekly,
    daily: [...daily.values()],
    regions: [...regions.values()]
      .sort((a, b) => b.courses + b.tracks - (a.courses + a.tracks))
      .slice(0, TOP_REGIONS),
    recent: await withAuthors(supabase, recent),
  }
}

async function withAuthors(
  supabase: SupabaseClient,
  rows: (RecentContentRow & { kind: "course" | "track" })[]
): Promise<DashboardStats["recent"]> {
  if (rows.length === 0) return []

  const authors = new Map(
    (
      await fetchAuthors(supabase, [...new Set(rows.map((row) => row.user_id))])
    ).map((author) => [author.id, author])
  )

  return rows.map((row) => {
    const author = authors.get(row.user_id)
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      region: row.start_address_region,
      likes: row.likes_count ?? 0,
      createdAt: row.created_at,
      author: {
        nickname: author?.nickname ?? "알 수 없음",
        isAnonymous: author?.is_anonymous ?? false,
      },
    }
  })
}
