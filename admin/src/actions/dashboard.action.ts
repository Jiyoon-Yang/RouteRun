"use server"

import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { countPendingReports } from "@/repositories/report.repository"
import { getDashboardStats } from "@/services/dashboard.service"

/** 대시보드 KPI·차트·최근 등록 조회. 실패하면 null을 돌려 대시보드에 안내만 띄운다. */
export async function getDashboardStatsAction() {
  await requireAdmin()

  try {
    // 미처리 제보는 처리하면 바로 줄어야 해서 집계 캐시 밖에서 따로 센다.
    const [stats, pendingReports] = await Promise.all([
      getDashboardStats(),
      countPendingReports(createAdminClient()),
    ])
    return { ...stats, pendingReports }
  } catch (error) {
    console.error("[getDashboardStatsAction]", error)
    return null
  }
}
