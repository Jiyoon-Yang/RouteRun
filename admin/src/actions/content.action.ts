"use server"

import { updateTag } from "next/cache"

import { MAX_BULK_CONTENT } from "@/commons/constants/content"
import type { ContentKind } from "@/commons/types/admin"
import { requireAdmin } from "@/lib/require-admin"
import { getContents, setContentHidden } from "@/services/content.service"
import { DASHBOARD_CACHE_TAG } from "@/services/dashboard.service"

const MAX_REASON = 200

/** 숨긴 글을 포함한 전체 코스·트랙. 실패하면 null을 돌려 화면에 안내만 띄운다. */
export async function getContentsAction() {
  await requireAdmin()

  try {
    return await getContents()
  } catch (error) {
    console.error("[getContentsAction]", error)
    return null
  }
}

/** 숨김(사유 필수) 또는 해제(사유 없음). 반영했으면 true. */
export async function setContentHiddenAction(
  kind: ContentKind,
  ids: string[],
  isHidden: boolean,
  reason: string | null
) {
  const admin = await requireAdmin()

  // 액션은 직접 호출될 수 있어서 입력을 다시 확인한다.
  if (
    (kind !== "course" && kind !== "track") ||
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAX_BULK_CONTENT ||
    !ids.every((id) => typeof id === "string") ||
    typeof isHidden !== "boolean"
  ) {
    return false
  }

  const trimmed = typeof reason === "string" ? reason.trim() : ""
  if (isHidden && (!trimmed || trimmed.length > MAX_REASON)) return false

  try {
    await setContentHidden(
      admin.id,
      kind,
      ids,
      isHidden,
      isHidden ? trimmed : null
    )
  } catch (error) {
    console.error("[setContentHiddenAction]", error)
    return false
  }

  // 대시보드 코스·트랙 수와 최근 등록이 10분 캐시를 기다리지 않고 바로 바뀌게 한다.
  updateTag(DASHBOARD_CACHE_TAG)
  return true
}
