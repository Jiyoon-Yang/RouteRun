"use client"

import { useEffect, useState } from "react"

import { countPendingReportsAction } from "@/actions/report.action"

/** 미처리 제보 수. 화면을 옮길 때마다 다시 세서 제보 화면에서 처리한 결과가 반영된다. */
export function usePendingReportCount(pathname: string) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    countPendingReportsAction()
      .then((result) => {
        if (!cancelled) setCount(result)
      })
      .catch((error) => {
        if (!cancelled)
          console.error("[usePendingReportCount] 조회 실패:", error)
      })

    return () => {
      cancelled = true
    }
  }, [pathname])

  return count
}
