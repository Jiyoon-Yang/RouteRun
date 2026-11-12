"use server"

import { REPORT_STATUS_LABEL } from "@/commons/constants/labels"
import type { ReportStatus } from "@/commons/types/admin"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { countPendingReports } from "@/repositories/report.repository"
import { getReports, updateReport } from "@/services/report.service"

/** 제보 전체와 신고자 정보. 실패하면 null을 돌려 화면에 안내만 띄운다. */
export async function getReportsAction() {
  await requireAdmin()

  try {
    return await getReports()
  } catch (error) {
    console.error("[getReportsAction]", error)
    return null
  }
}

/** 상태 변경·메모 저장. 저장된 제보를 돌려주고, 실패하면 null. */
export async function updateReportAction(
  id: string,
  patch: { status?: ReportStatus; adminNote: string }
) {
  const admin = await requireAdmin()

  // 액션은 직접 호출될 수 있어서 입력을 다시 확인한다. status는 DB check 제약이 한 번 더 막는다.
  if (
    typeof id !== "string" ||
    typeof patch?.adminNote !== "string" ||
    (patch.status !== undefined &&
      !Object.hasOwn(REPORT_STATUS_LABEL, patch.status))
  ) {
    return null
  }

  try {
    return await updateReport(admin.id, id, {
      status: patch.status,
      adminNote: patch.adminNote,
    })
  } catch (error) {
    console.error("[updateReportAction]", error)
    return null
  }
}

/** 사이드바 배지용 미처리(접수·처리중) 제보 수. 실패하면 null. */
export async function countPendingReportsAction() {
  await requireAdmin()

  try {
    return await countPendingReports(createAdminClient())
  } catch (error) {
    console.error("[countPendingReportsAction]", error)
    return null
  }
}
