"use server"

import { requireAdmin } from "@/lib/require-admin"
import { getDashboardStats } from "@/services/dashboard.service"

/** 대시보드 KPI·차트·최근 등록 조회. 실패하면 null을 돌려 대시보드에 안내만 띄운다. */
export async function getDashboardStatsAction() {
  await requireAdmin()

  try {
    return await getDashboardStats()
  } catch (error) {
    console.error("[getDashboardStatsAction]", error)
    return null
  }
}
