import { REPORT_STATUS_LABEL } from "@/commons/constants/labels"
import type { Report, Reporter, ReportStatus } from "@/commons/types/admin"
import { formatReportId } from "@/commons/utils/format"
import { createAdminClient } from "@/lib/supabase/admin"
import { logAdminAction } from "@/repositories/admin-log.repository"
import { fetchAuthors } from "@/repositories/dashboard.repository"
import {
  fetchContentCounts,
  fetchReports,
  updateReport as updateReportRow,
  type ReportRow,
} from "@/repositories/report.repository"

const toReport = (row: ReportRow): Report => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  content: row.content,
  createdAt: row.created_at,
  status: row.status,
  adminNote: row.admin_note,
  handledAt: row.handled_at,
})

/** 제보 전체와 신고자 정보. Service Role로 읽으므로 호출 전에 `requireAdmin()`을 거친다. */
export async function getReports(): Promise<{
  reports: Report[]
  reporters: Record<string, Reporter>
}> {
  const supabase = createAdminClient()
  const rows = await fetchReports(supabase)
  if (rows.length === 0) return { reports: [], reporters: {} }

  const userIds = [...new Set(rows.map((row) => row.user_id))]
  const [authors, counts] = await Promise.all([
    fetchAuthors(supabase, userIds),
    fetchContentCounts(supabase, userIds),
  ])
  const authorById = new Map(authors.map((author) => [author.id, author]))

  return {
    reports: rows.map(toReport),
    reporters: Object.fromEntries(
      userIds.map((id) => {
        const author = authorById.get(id)
        const count = counts.get(id)
        return [
          id,
          {
            nickname: author?.nickname ?? "알 수 없음",
            isAnonymous: author?.is_anonymous ?? false,
            avatarUrl: author?.profile_image_url ?? null,
            courseCount: count?.courses ?? 0,
            trackCount: count?.tracks ?? 0,
          },
        ]
      })
    ),
  }
}

/** 메모 저장과 상태 변경. 상태가 바뀌면 처리 시각을 맞추고 조치 기록을 남긴다. */
export async function updateReport(
  adminId: string,
  id: string,
  { status, adminNote }: { status?: ReportStatus; adminNote: string }
): Promise<Report> {
  const supabase = createAdminClient()
  const row = await updateReportRow(supabase, id, {
    admin_note: adminNote,
    // 완료에서 처리중으로 되돌리면 처리 시각도 비운다.
    ...(status && {
      status,
      handled_at: status === "resolved" ? new Date().toISOString() : null,
    }),
  })

  // 메모만 저장할 때는 사용자에게 보이는 조치가 아니라서 기록하지 않는다.
  if (status) {
    // shortcut: 수정과 기록이 트랜잭션이 아님, 기록이 빠지면 안 되는 조치가 생기면 RPC로 묶는다
    // 수정은 이미 반영됐으니 기록 실패로 화면에 실패를 띄우지 않는다(다시 누르면 기록이 중복된다).
    await logAdminAction(supabase, {
      adminId,
      action: "update_report",
      target: `제보 ${formatReportId(id)} → ${REPORT_STATUS_LABEL[status]}`,
      reason: adminNote.trim() || null,
    }).catch((error) => console.error("[updateReport] 조치 기록 실패:", error))
  }

  return toReport(row)
}
