import type { SupabaseClient } from "@supabase/supabase-js"

import { AUDIT_PAGE_SIZE } from "@/commons/constants/content"
import type { AuditFilters, LogAction } from "@/commons/types/admin"

/** 관리자 조치를 `admin_logs`에 남긴다. 테이블은 Service Role로만 쓸 수 있다. */
export async function logAdminAction(
  supabase: SupabaseClient,
  log: {
    adminId: string
    action: LogAction
    target: string
    reason: string | null
  }
): Promise<void> {
  const { error } = await supabase.from("admin_logs").insert({
    admin_id: log.adminId,
    action: log.action,
    target: log.target,
    reason: log.reason,
  })

  if (error) {
    throw new Error(`admin_logs: ${error.message}`)
  }
}

export type AdminLogRow = {
  id: number
  admin_id: string | null
  action: LogAction
  target: string
  reason: string | null
  created_at: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 여러 컬럼 중 하나라도 query를 포함하면 맞는 PostgREST `or` 조건.
 * %·_는 글자로 찾고, 값을 큰따옴표로 감싸 쉼표·괄호가 or 문법을 깨지 않게 한다.
 */
export function ilikeAny(columns: string[], query: string): string {
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`
  const quoted = `"${pattern.replace(/["\\]/g, "\\$&")}"`
  return columns.map((column) => `${column}.ilike.${quoted}`).join(",")
}

/** 조건에 맞는 기록 한 페이지와 전체 수. 최신순. */
export async function fetchAdminLogs(
  supabase: SupabaseClient,
  { period, action, adminId, query, page }: AuditFilters
): Promise<{ rows: AdminLogRow[]; total: number }> {
  const filtered = (columns: string, options: { head?: boolean }) => {
    let request = supabase
      .from("admin_logs")
      .select(columns, { count: "exact", ...options })
    if (period !== "all")
      request = request.gte(
        "created_at",
        new Date(Date.now() - Number(period) * DAY_MS).toISOString()
      )
    if (action !== "all") request = request.eq("action", action)
    if (adminId !== "all") request = request.eq("admin_id", adminId)
    if (query) request = request.or(ilikeAny(["target", "reason"], query))
    return request
  }

  const from = (page - 1) * AUDIT_PAGE_SIZE
  const { data, error, count } = await filtered(
    "id, admin_id, action, target, reason, created_at",
    {}
  )
    .order("id", { ascending: false })
    .range(from, from + AUDIT_PAGE_SIZE - 1)
    .overrideTypes<AdminLogRow[], { merge: false }>()

  // 기간이 지나 기록이 빠져 페이지가 범위를 벗어나면 PostgREST가 오류를 낸다. 빈 페이지와 실제 수로 돌려준다.
  if (error?.code === "PGRST103") {
    const head = await filtered("id", { head: true })
    if (!head.error) return { rows: [], total: head.count ?? 0 }
  }

  if (error) {
    throw new Error(`admin_logs: ${error.message}`)
  }

  return { rows: data, total: count ?? 0 }
}
