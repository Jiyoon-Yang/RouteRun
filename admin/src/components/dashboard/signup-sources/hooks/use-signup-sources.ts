"use client"

import { useEffect, useState } from "react"

import { getSignupSourcesAction } from "@/actions/search-stats.action"
import type { SignupSource } from "@/commons/types/admin"

/** 구글 API가 느릴 수 있어 대시보드를 먼저 그리고 가입 경로는 따로 불러온다. */
export function useSignupSources() {
  const [sources, setSources] = useState<SignupSource[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getSignupSourcesAction()
      .then((result) => {
        if (!cancelled) setSources(result)
      })
      .catch((error) => {
        if (!cancelled) console.error("[useSignupSources] 조회 실패:", error)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { sources, isLoading }
}
