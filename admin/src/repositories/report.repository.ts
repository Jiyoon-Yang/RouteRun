import type { SupabaseClient } from "@supabase/supabase-js"

import type { ReportStatus, ReportType } from "@/commons/types/admin"

export type ReportRow = {
  id: string
  user_id: string
  type: ReportType
  content: string
  status: ReportStatus
  admin_note: string
  handled_at: string | null
  created_at: string
}

const REPORT_SELECT =
  "id, user_id, type, content, status, admin_note, handled_at, created_at"

// shortcut: PostgREST 기본 1000행 제한, 제보가 1000건을 넘으면 페이지네이션
export async function fetchReports(
  supabase: SupabaseClient
): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_SELECT)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`reports: ${error.message}`)
  }

  return data
}

export async function updateReport(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<ReportRow, "status" | "admin_note" | "handled_at">>
): Promise<ReportRow> {
  const { data, error } = await supabase
    .from("reports")
    .update(patch)
    .eq("id", id)
    .select(REPORT_SELECT)
    .single()

  if (error) {
    throw new Error(`reports: ${error.message}`)
  }

  return data
}

/** 접수·처리중 제보 수. 사이드바 배지와 대시보드에 쓴다. */
export async function countPendingReports(
  supabase: SupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .neq("status", "resolved")

  if (error) {
    throw new Error(`reports: ${error.message}`)
  }

  return count ?? 0
}

// shortcut: PostgREST 기본 1000행 제한, 신고자들의 글이 1000개를 넘으면 집계 RPC로 바꾼다
// shortcut: `.in()`은 id를 URL에 싣는다, 신고자가 약 200명을 넘으면 URL 길이 한계에 걸리니 같은 RPC로 바꾼다
/** 유저별 코스·트랙 수. 행의 `user_id`만 받아서 센다. */
export async function fetchContentCounts(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, { courses: number; tracks: number }>> {
  const counts = new Map<string, { courses: number; tracks: number }>(
    userIds.map((id) => [id, { courses: 0, tracks: 0 }])
  )
  if (userIds.length === 0) return counts

  const [routes, tracks] = await Promise.all(
    (["routes", "tracks"] as const).map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select("user_id")
        .in("user_id", userIds)

      if (error) {
        throw new Error(`${table}: ${error.message}`)
      }

      return data
    })
  )

  for (const row of routes) counts.get(row.user_id)!.courses++
  for (const row of tracks) counts.get(row.user_id)!.tracks++

  return counts
}
