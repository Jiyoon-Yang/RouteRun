"use server"

import { MAX_BULK_CONTENT, MAX_REASON } from "@/commons/constants/content"
import type { ImageFilters, ImageTarget } from "@/commons/types/admin"
import { requireAdmin } from "@/lib/require-admin"
import { deleteImages, getImages } from "@/services/image.service"

/** 조건에 맞는 사진 한 페이지. 실패하면 null을 돌려 화면에 안내만 띄운다. */
export async function getImagesAction({ kind, page }: ImageFilters) {
  await requireAdmin()

  // 액션은 직접 호출될 수 있어서 입력을 다시 확인한다.
  if (
    !["all", "course", "track"].includes(kind) ||
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    return null
  }

  try {
    return await getImages({ kind, page })
  } catch (error) {
    console.error("[getImagesAction]", error)
    return null
  }
}

/** 사진을 스토리지와 글에서 지운다(사유 필수, 되돌릴 수 없음). 반영했으면 true. */
export async function deleteImagesAction(
  targets: ImageTarget[],
  reason: string
) {
  const admin = await requireAdmin()

  // 액션은 직접 호출될 수 있어서 입력을 다시 확인한다.
  if (
    !Array.isArray(targets) ||
    targets.length === 0 ||
    targets.length > MAX_BULK_CONTENT ||
    !targets.every(
      (target) =>
        (target?.kind === "course" || target?.kind === "track") &&
        typeof target.contentId === "string" &&
        typeof target.url === "string"
    )
  ) {
    return false
  }

  const trimmed = typeof reason === "string" ? reason.trim() : ""
  if (!trimmed || trimmed.length > MAX_REASON) return false

  try {
    await deleteImages(admin.id, targets, trimmed)
  } catch (error) {
    console.error("[deleteImagesAction]", error)
    return false
  }

  return true
}
