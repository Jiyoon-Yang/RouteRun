"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  getContentsAction,
  setContentHiddenAction,
} from "@/actions/content.action"
import type { Content, ContentKind } from "@/commons/types/admin"

/** 코스·트랙 목록을 불러오고, 숨김·해제하면 목록을 맞춘다. 실패 안내는 여기서 띄운다. */
export function useContents() {
  const [contents, setContents] = useState<Content[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getContentsAction()
      .then((result) => {
        if (!cancelled) setContents(result)
      })
      .catch((error) => {
        if (!cancelled) console.error("[useContents] 조회 실패:", error)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /** 반영에 성공하면 true. 숨길 때만 사유를 넘긴다. */
  async function setHidden(
    kind: ContentKind,
    ids: string[],
    isHidden: boolean,
    reason: string | null = null
  ) {
    const ok = await setContentHiddenAction(kind, ids, isHidden, reason).catch(
      (error) => {
        console.error("[useContents] 숨김 변경 실패:", error)
        return false
      }
    )

    if (!ok) {
      toast.error("반영하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      return false
    }

    setContents(
      (current) =>
        current &&
        current.map((content) =>
          content.kind === kind && ids.includes(content.id)
            ? { ...content, isHidden }
            : content
        )
    )
    toast.success(`${ids.length}개 ${isHidden ? "숨김" : "숨김 해제"}`)
    return true
  }

  return { contents, isLoading, setHidden }
}
