"use client"

import { useEffect, useState } from "react"

import { getUserDetailAction, getUsersAction } from "@/actions/user.action"
import type { UserDetail, UserFilters, UserList } from "@/commons/types/admin"

/** 조건에 맞는 유저 한 페이지. 실패하면 users가 null이다. */
export function useUsers({ type, query, page }: UserFilters) {
  // 받아온 결과가 지금 조건의 것이 아니면 로딩 중이다(페이지·필터를 바꾼 직후).
  const key = JSON.stringify([type, query, page])
  const [loaded, setLoaded] = useState<{
    key: string
    list: UserList | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    getUsersAction({ type, query, page })
      .then((list) => {
        if (!cancelled) setLoaded({ key, list })
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[useUsers] 조회 실패:", error)
          setLoaded({ key, list: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, type, query, page])

  return {
    users: loaded?.list?.items ?? null,
    total: loaded?.list?.total ?? 0,
    isLoading: loaded?.key !== key,
  }
}

/** 고른 유저의 이메일·활동. id가 없으면 아무것도 부르지 않는다. 실패하면 detail이 null이다. */
export function useUserDetail(userId: string | null) {
  const [loaded, setLoaded] = useState<{
    userId: string
    detail: UserDetail | null
  } | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    getUserDetailAction(userId)
      .then((detail) => {
        if (!cancelled) setLoaded({ userId, detail })
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[useUserDetail] 조회 실패:", error)
          setLoaded({ userId, detail: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const current = loaded?.userId === userId ? loaded : null
  return {
    detail: current?.detail ?? null,
    isLoading: !!userId && !current,
  }
}
