"use client"

import { useEffect, useState } from "react"

import { getSearchStatsAction } from "@/actions/search-stats.action"
import type { SearchStats } from "@/commons/types/admin"

/** 구글 API가 느릴 수 있어 대시보드를 먼저 그리고 검색 유입은 따로 불러온다. */
export function useSearchStats() {
  const [stats, setStats] = useState<SearchStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getSearchStatsAction()
      .then((result) => {
        if (!cancelled) setStats(result)
      })
      .catch((error) => {
        if (!cancelled) console.error("[useSearchStats] 조회 실패:", error)
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
