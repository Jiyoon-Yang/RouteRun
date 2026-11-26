"use server"

import { LOG_ACTION_LABEL } from "@/commons/constants/labels"
import type { AuditFilters } from "@/commons/types/admin"
import { requireAdmin } from "@/lib/require-admin"
import { getAuditLogs } from "@/services/audit.service"

const MAX_QUERY = 100

/** 조건에 맞는 작업 기록 한 페이지. 실패하면 null을 돌려 화면에 안내만 띄운다. */
export async function getAuditLogsAction(filters: AuditFilters) {
  await requireAdmin()

  // 액션은 직접 호출될 수 있어서 입력을 다시 확인한다.
  const { period, action, adminId, query, page } = filters ?? {}
  if (
    !["1", "7", "30", "all"].includes(period) ||
    (action !== "all" && !Object.hasOwn(LOG_ACTION_LABEL, action)) ||
    typeof adminId !== "string" ||
    !adminId ||
    typeof query !== "string" ||
    query.length > MAX_QUERY ||
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    return null
  }

  try {
    return await getAuditLogs({ period, action, adminId, query, page })
  } catch (error) {
    console.error("[getAuditLogsAction]", error)
    return null
  }
}
