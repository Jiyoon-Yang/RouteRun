"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { deleteImagesAction, getImagesAction } from "@/actions/image.action"
import { MAX_BULK_CONTENT } from "@/commons/constants/content"
import type {
  ImageFilters,
  ImageList,
  ImageTarget,
} from "@/commons/types/admin"

/** 조건에 맞는 사진 한 페이지를 불러오고, 지우면 지금 페이지를 다시 불러온다. 실패 안내는 여기서 띄운다. */
export function useImages({ kind, page }: ImageFilters) {
  // 받아온 결과가 지금 조건의 것이 아니면 로딩 중이다(페이지·종류를 바꾼 직후).
  const key = JSON.stringify([kind, page])
  const [loaded, setLoaded] = useState<{
    key: string
    list: ImageList | null
  } | null>(null)
  // 삭제 뒤 지금 페이지를 다시 받는다. key에 넣지 않아 스켈레톤 없이 사진만 바뀐다.
  const [reload, setReload] = useState(0)
  const list = loaded?.list ?? null

  useEffect(() => {
    let cancelled = false

    getImagesAction({ kind, page })
      .then((result) => {
        if (!cancelled) setLoaded({ key, list: result })
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[useImages] 조회 실패:", error)
          setLoaded({ key, list: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, kind, page, reload])

  /** 반영에 성공하면 true. */
  async function deleteImages(targets: ImageTarget[], reason: string) {
    if (targets.length > MAX_BULK_CONTENT) {
      toast.error(`한 번에 ${MAX_BULK_CONTENT}장까지 지울 수 있어요.`)
      return false
    }

    const ok = await deleteImagesAction(targets, reason).catch((error) => {
      console.error("[useImages] 삭제 실패:", error)
      return false
    })

    // 실패해도 앞의 글은 이미 지워졌을 수 있어서 다시 받는다.
    setReload((count) => count + 1)
    if (!ok) {
      toast.error("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      return false
    }

    toast.success(`사진 ${targets.length}장 삭제`)
    return true
  }

  return {
    images: list?.items ?? null,
    total: list?.total ?? 0,
    isLoading: loaded?.key !== key,
    deleteImages,
  }
}
