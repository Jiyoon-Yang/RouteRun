import type { SupabaseClient } from "@supabase/supabase-js"

import type { LogAction } from "@/commons/types/admin"

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
