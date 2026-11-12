import type { Notice, NoticeDraft, NoticeStatus } from "@/commons/types/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { logAdminAction } from "@/repositories/admin-log.repository"
import {
  deleteNotice as deleteNoticeRow,
  fetchNotice,
  fetchNotices,
  insertNotice,
  unpinNotices,
  updateNotice,
  type NoticeRow,
} from "@/repositories/notice.repository"

const toNotice = (row: NoticeRow): Notice => ({
  id: row.id,
  title: row.title,
  body: row.body,
  status: row.status,
  pinned: row.pinned,
  publishedAt: row.published_at,
  updatedAt: row.updated_at,
})

/** 초안 포함 전체 공지. Service Role로 읽으므로 호출 전에 `requireAdmin()`을 거친다. */
export async function getNotices(): Promise<Notice[]> {
  return (await fetchNotices(createAdminClient())).map(toNotice)
}

/**
 * 새 공지(`id`가 null)를 만들거나 기존 공지를 고친다.
 * 고정하면 기존 고정을 풀고, 초안이 게시로 바뀌면 조치 기록을 남긴다.
 */
export async function saveNotice(
  adminId: string,
  id: string | null,
  draft: NoticeDraft,
  status: NoticeStatus
): Promise<Notice> {
  const supabase = createAdminClient()
  const previous = id ? await fetchNotice(supabase, id) : null
  if (id && !previous) {
    throw new Error(`notices: ${id} 없음`)
  }

  // shortcut: 고정 해제와 저장이 트랜잭션이 아님, 저장이 실패하면 고정 공지가 없어진다. 문제 되면 RPC로 묶는다
  if (draft.pinned && !previous?.pinned) {
    await unpinNotices(supabase)
  }

  const now = new Date().toISOString()
  const row = {
    ...draft,
    status,
    // 게시 상태로 다시 저장하면 처음 게시일을 유지하고, 초안으로 되돌리면 비운다.
    published_at:
      status === "published" ? (previous?.published_at ?? now) : null,
    updated_at: now,
  }
  const saved = id
    ? await updateNotice(supabase, id, row)
    : await insertNotice(supabase, row)

  // 사용자에게 새로 보이게 될 때만 기록한다. 게시 중인 공지 수정·초안 저장은 기록하지 않는다.
  if (status === "published" && previous?.status !== "published") {
    // 저장은 이미 반영됐으니 기록 실패로 화면에 실패를 띄우지 않는다(다시 누르면 기록이 중복된다).
    await logAdminAction(supabase, {
      adminId,
      action: "publish_notice",
      target: `공지 '${saved.title}'`,
      reason: null,
    }).catch((error) => console.error("[saveNotice] 조치 기록 실패:", error))
  }

  return toNotice(saved)
}

/** 공지를 지우고 기록을 남긴다. 이미 없는 공지면 false. */
export async function deleteNotice(
  adminId: string,
  id: string
): Promise<boolean> {
  const supabase = createAdminClient()
  const deleted = await deleteNoticeRow(supabase, id)
  if (!deleted) return false

  await logAdminAction(supabase, {
    adminId,
    action: "delete_notice",
    target: `공지 '${deleted.title}'`,
    reason: null,
  }).catch((error) => console.error("[deleteNotice] 조치 기록 실패:", error))

  return true
}
