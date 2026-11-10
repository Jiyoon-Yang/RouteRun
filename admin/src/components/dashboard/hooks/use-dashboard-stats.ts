"use client"

import { useEffect, useState } from "react"

import { getDashboardStatsAction } from "@/actions/dashboard.action"
import type { DashboardStats } from "@/commons/types/admin"

/** 대시보드 지표를 한 번에 불러온다. 조회는 액션 안에서 병렬로 묶여 있다. */
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getDashboardStatsAction()
      .then((result) => {
        if (!cancelled) setStats(result)
      })
      .catch((error) => {
        if (!cancelled) console.error("[useDashboardStats] 조회 실패:", error)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { stats, isLoading }
}
