"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  deleteNoticeAction,
  getNoticesAction,
  saveNoticeAction,
} from "@/actions/notice.action"
import type { Notice, NoticeDraft, NoticeStatus } from "@/commons/types/admin"

/** 공지 목록을 불러오고, 저장·삭제하면 목록을 맞춘다. 실패 안내는 여기서 띄운다. */
export function useNotices() {
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getNoticesAction()
      .then((result) => {
        if (!cancelled) setNotices(result)
      })
      .catch((error) => {
        if (!cancelled) console.error("[useNotices] 조회 실패:", error)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /** 저장에 성공하면 true. `id`가 null이면 새 공지. */
  async function save(
    id: string | null,
    draft: NoticeDraft,
    status: NoticeStatus
  ) {
    const saved = await saveNoticeAction(id, draft, status).catch((error) => {
      console.error("[useNotices] 저장 실패:", error)
      return null
    })

    if (!saved) {
      toast.error("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      return false
    }

    // 새로 고정하면 서버가 기존 고정을 풀었으니 목록에서도 푼다.
    setNotices(
      (current) =>
        current && [
          saved,
          ...current
            .filter((notice) => notice.id !== saved.id)
            .map((notice) =>
              saved.pinned ? { ...notice, pinned: false } : notice
            ),
        ]
    )
    return true
  }

  /** 삭제에 성공하면 true. */
  async function remove(id: string) {
    const deleted = await deleteNoticeAction(id).catch((error) => {
      console.error("[useNotices] 삭제 실패:", error)
      return false
    })

    if (!deleted) {
      toast.error("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      return false
    }

    setNotices(
      (current) => current && current.filter((notice) => notice.id !== id)
    )
    return true
  }

  return { notices, isLoading, save, remove }
}
