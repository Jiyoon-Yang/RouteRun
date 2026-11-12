"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  getContentRegionsAction,
  getContentsAction,
  setContentHiddenAction,
} from "@/actions/content.action"
import { MAX_BULK_CONTENT } from "@/commons/constants/content"
import type {
  ContentFilters,
  ContentKind,
  ContentList,
} from "@/commons/types/admin"

/** 조건에 맞는 코스·트랙 한 페이지와 지역 목록을 불러오고, 숨김·해제하면 목록을 맞춘다. 실패 안내는 여기서 띄운다. */
export function useContents({
  kind,
  region,
  visibility,
  query,
  page,
}: ContentFilters) {
  // 받아온 결과가 지금 조건의 것이 아니면 로딩 중이다(페이지·필터를 바꾼 직후).
  const key = JSON.stringify([kind, region, visibility, query, page])
  const [loaded, setLoaded] = useState<{
    key: string
    list: ContentList | null
  } | null>(null)
  const [regions, setRegions] = useState<string[]>([])
  // 숨김·해제 뒤 지금 페이지를 다시 받는다. key에 넣지 않아 스켈레톤 없이 행만 바뀐다.
  const [reload, setReload] = useState(0)
  const list = loaded?.list ?? null

  useEffect(() => {
    let cancelled = false

    getContentsAction({ kind, region, visibility, query, page })
      .then((result) => {
        if (!cancelled) setLoaded({ key, list: result })
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[useContents] 조회 실패:", error)
          setLoaded({ key, list: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, kind, region, visibility, query, page, reload])

  useEffect(() => {
    let cancelled = false

    // 지역 목록을 못 받아도 목록은 보이게 "모든 지역"만 남긴다.
    getContentRegionsAction(kind)
      .then((result) => {
        if (!cancelled) setRegions(result ?? [])
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[useContents] 지역 조회 실패:", error)
          setRegions([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [kind])

  /** 반영에 성공하면 true. 숨길 때만 사유를 넘긴다. */
  async function setHidden(
    kind: ContentKind,
    ids: string[],
    isHidden: boolean,
    reason: string | null = null
  ) {
    if (ids.length > MAX_BULK_CONTENT) {
      toast.error(`한 번에 ${MAX_BULK_CONTENT}개까지 처리할 수 있어요.`)
      return false
    }

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

    // 배지만 바꾸면 "공개만"·"숨김만" 필터에서 필터와 어긋난 행이 남고, 다음 페이지가 한 칸씩 밀려 글을 놓친다.
    setReload((count) => count + 1)
    toast.success(`${ids.length}개 ${isHidden ? "숨김" : "숨김 해제"}`)
    return true
  }

  return {
    contents: list?.items ?? null,
    total: list?.total ?? 0,
    regions,
    isLoading: loaded?.key !== key,
    setHidden,
  }
}
