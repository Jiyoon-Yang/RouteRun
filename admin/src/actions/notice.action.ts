"use server"

import type { NoticeDraft, NoticeStatus } from "@/commons/types/admin"
import { requireAdmin } from "@/lib/require-admin"
import { deleteNotice, getNotices, saveNotice } from "@/services/notice.service"

/** 초안 포함 전체 공지. 실패하면 null을 돌려 화면에 안내만 띄운다. */
export async function getNoticesAction() {
  await requireAdmin()

  try {
    return await getNotices()
  } catch (error) {
    console.error("[getNoticesAction]", error)
    return null
  }
}

/** 새 공지(`id`가 null) 작성 또는 수정. 저장된 공지를 돌려주고, 실패하면 null. */
export async function saveNoticeAction(
  id: string | null,
  draft: NoticeDraft,
  status: NoticeStatus
) {
  const admin = await requireAdmin()

  // 액션은 직접 호출될 수 있어서 입력을 다시 확인한다. 제목 길이·status는 DB check 제약이 한 번 더 막는다.
  if (
    (id !== null && typeof id !== "string") ||
    typeof draft?.title !== "string" ||
    typeof draft.body !== "string" ||
    typeof draft.pinned !== "boolean" ||
    (status !== "draft" && status !== "published")
  ) {
    return null
  }

  const title = draft.title.trim()
  const body = draft.body.trim()
  // 다이얼로그와 같은 규칙: 제목은 항상, 본문은 게시할 때만 필수
  if (!title || title.length > 60 || (status === "published" && !body)) {
    return null
  }

  try {
    return await saveNotice(
      admin.id,
      id,
      { title, body, pinned: draft.pinned },
      status
    )
  } catch (error) {
    console.error("[saveNoticeAction]", error)
    return null
  }
}

/** 공지 삭제. 지웠으면 true. */
export async function deleteNoticeAction(id: string) {
  const admin = await requireAdmin()

  if (typeof id !== "string") return false

  try {
    return await deleteNotice(admin.id, id)
  } catch (error) {
    console.error("[deleteNoticeAction]", error)
    return false
  }
}
