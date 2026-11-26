import type { AuditFilters, AuditList } from "@/commons/types/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchAdminIds } from "@/repositories/admin.repository"
import { fetchAdminLogs } from "@/repositories/admin-log.repository"
import { fetchAuthUser } from "@/repositories/user.repository"

/** 조건에 맞는 작업 기록 한 페이지와 관리자 이메일. Service Role로 읽으므로 호출 전에 `requireAdmin()`을 거친다. */
export async function getAuditLogs(filters: AuditFilters): Promise<AuditList> {
  const supabase = createAdminClient()
  const [{ rows, total }, adminIds] = await Promise.all([
    fetchAdminLogs(supabase, filters),
    fetchAdminIds(supabase),
  ])

  // 관리자는 몇 명뿐이라 한 명씩 읽는다. 명단에서 빠진 관리자의 옛 기록도 이메일로 보인다.
  const ids = [
    ...new Set([
      ...adminIds,
      ...rows.flatMap((row) => (row.admin_id ? [row.admin_id] : [])),
    ]),
  ]
  const emails = new Map(
    await Promise.all(
      ids.map(async (id) => {
        // 이메일 하나를 못 읽어도 기록 화면은 띄운다.
        const email = await fetchAuthUser(supabase, id)
          .then((user) => user.email)
          .catch((error) => {
            console.error("[getAuditLogs] 관리자 이메일 조회 실패:", id, error)
            return null
          })
        return [id, email ?? `#${id.slice(0, 8)}`] as const
      })
    )
  )

  return {
    items: rows.map((row) => ({
      id: String(row.id),
      // 관리자 계정을 지우면 FK SET NULL로 비워진다.
      admin: row.admin_id
        ? emails.get(row.admin_id)!
        : "삭제된 관리자",
      action: row.action,
      target: row.target,
      reason: row.reason,
      at: row.created_at,
    })),
    total,
    admins: adminIds.map((id) => ({ id, email: emails.get(id)! })),
  }
}
