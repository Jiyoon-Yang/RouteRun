"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { getReportsAction, updateReportAction } from "@/actions/report.action"
import type { Report, Reporter, ReportStatus } from "@/commons/types/admin"

type ReportsData = {
  reports: Report[]
  reporters: Record<string, Reporter>
}

/** 제보 목록과 신고자를 불러오고, 저장하면 돌려받은 제보로 목록을 바꾼다. */
export function useReports() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getReportsAction()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((error) => {
        if (!cancelled) console.error("[useReports] 조회 실패:", error)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /** 저장에 성공하면 true. 실패 안내는 여기서 띄운다. */
  async function update(
    id: string,
    patch: { status?: ReportStatus; adminNote: string }
  ) {
    const updated = await updateReportAction(id, patch).catch((error) => {
      console.error("[useReports] 저장 실패:", error)
      return null
    })

    if (!updated) {
      toast.error("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      return false
    }

    setData(
      (current) =>
        current && {
          ...current,
          reports: current.reports.map((report) =>
            report.id === id ? updated : report
          ),
        }
    )
    return true
  }

  return { data, isLoading, update }
}
