"use client"

import { useEffect, useState } from "react"

import { getAuditLogsAction } from "@/actions/audit.action"
import type { AuditFilters, AuditList } from "@/commons/types/admin"

/** 조건에 맞는 작업 기록 한 페이지. 실패하면 list가 null이다. */
export function useAuditLogs({
  period,
  action,
  adminId,
  query,
  page,
}: AuditFilters) {
  // 받아온 결과가 지금 조건의 것이 아니면 로딩 중이다(페이지·필터를 바꾼 직후).
  const key = JSON.stringify([period, action, adminId, query, page])
  const [loaded, setLoaded] = useState<{
    key: string
    list: AuditList | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    getAuditLogsAction({ period, action, adminId, query, page })
      .then((list) => {
        if (!cancelled) setLoaded({ key, list })
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[useAuditLogs] 조회 실패:", error)
          setLoaded({ key, list: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, period, action, adminId, query, page])

  return {
    list: loaded?.list ?? null,
    // 관리자 선택지는 필터를 바꾸는 동안에도 사라지지 않게 마지막 결과를 쓴다.
    admins: loaded?.list?.admins ?? [],
    isLoading: loaded?.key !== key,
  }
}
