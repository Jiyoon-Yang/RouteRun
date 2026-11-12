"use server"

import { updateTag } from "next/cache"

import { MAX_BULK_CONTENT } from "@/commons/constants/content"
import type { ContentFilters, ContentKind } from "@/commons/types/admin"
import { requireAdmin } from "@/lib/require-admin"
import {
  getContentRegions,
  getContents,
  setContentHidden,
} from "@/services/content.service"
import { DASHBOARD_CACHE_TAG } from "@/services/dashboard.service"

const MAX_REASON = 200
// 검색어·지역 이름 길이 상한.
const MAX_FILTER_TEXT = 100

const isKind = (kind: unknown): kind is ContentKind =>
  kind === "course" || kind === "track"

/** 숨긴 글을 포함해 조건에 맞는 코스·트랙 한 페이지. 실패하면 null을 돌려 화면에 안내만 띄운다. */
export async function getContentsAction(filters: ContentFilters) {
  await requireAdmin()

  // 액션은 직접 호출될 수 있어서 입력을 다시 확인한다.
  const { kind, region, visibility, query, page } = filters
  if (
    !isKind(kind) ||
    typeof region !== "string" ||
    region.length > MAX_FILTER_TEXT ||
    !["all", "visible", "hidden"].includes(visibility) ||
    typeof query !== "string" ||
    query.length > MAX_FILTER_TEXT ||
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    return null
  }

  try {
    return await getContents({ kind, region, visibility, query, page })
  } catch (error) {
    console.error("[getContentsAction]", error)
    return null
  }
}

/** 지역 필터 목록. 실패하면 null. */
export async function getContentRegionsAction(kind: ContentKind) {
  await requireAdmin()

  if (!isKind(kind)) return null

  try {
    return await getContentRegions(kind)
  } catch (error) {
    console.error("[getContentRegionsAction]", error)
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
    !isKind(kind) ||
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
