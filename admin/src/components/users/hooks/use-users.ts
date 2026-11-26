"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  getUserDetailAction,
  getUsersAction,
  suspendUserAction,
  unsuspendUserAction,
} from "@/actions/user.action"
import type { UserDetail, UserFilters, UserList } from "@/commons/types/admin"

/** 조건에 맞는 유저 한 페이지. 실패하면 users가 null이다. */
export function useUsers({ type, query, page }: UserFilters) {
  // 받아온 결과가 지금 조건의 것이 아니면 로딩 중이다(페이지·필터를 바꾼 직후).
  const key = JSON.stringify([type, query, page])
  const [loaded, setLoaded] = useState<{
    key: string
    list: UserList | null
  } | null>(null)
  // 정지·해제 뒤 지금 페이지를 다시 받는다. key에 넣지 않아 스켈레톤 없이 배지만 바뀐다.
  const [reload, setReload] = useState(0)

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
  }, [key, type, query, page, reload])

  return {
    users: loaded?.list?.items ?? null,
    total: loaded?.list?.total ?? 0,
    isLoading: loaded?.key !== key,
    reload: () => setReload((count) => count + 1),
  }
}

/**
 * 고른 유저의 이메일·활동·정지. id가 없으면 아무것도 부르지 않는다. 실패하면 detail이 null이다.
 * 정지·해제에 성공하면 다시 받고 onChange(목록 배지 갱신)를 부른다. 실패 안내는 여기서 띄운다.
 */
export function useUserDetail(userId: string | null, onChange: () => void) {
  const [loaded, setLoaded] = useState<{
    userId: string
    detail: UserDetail | null
  } | null>(null)
  const [reload, setReload] = useState(0)

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
  }, [userId, reload])

  async function run(action: () => Promise<boolean>, success: string) {
    const ok = await action().catch((error) => {
      console.error("[useUserDetail] 정지 변경 실패:", error)
      return false
    })

    if (!ok) {
      toast.error("반영하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      return false
    }

    setReload((count) => count + 1)
    onChange()
    toast.success(success)
    return true
  }

  const current = loaded?.userId === userId ? loaded : null
  return {
    detail: current?.detail ?? null,
    isLoading: !!userId && !current,
    /** 반영에 성공하면 true. days 0은 영구. */
    suspend: (days: number, reason: string) =>
      run(() => suspendUserAction(userId!, days, reason), "정지했습니다"),
    unsuspend: () =>
      run(() => unsuspendUserAction(userId!), "정지를 해제했습니다"),
  }
}
