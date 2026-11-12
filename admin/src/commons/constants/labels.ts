import type { LogAction, ReportStatus, ReportType } from "@/commons/types/admin"

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  bug: "버그",
  inconvenience: "불편함",
  suggestion: "제안",
}

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  open: "접수",
  in_progress: "처리중",
  resolved: "완료",
}

export const LOG_ACTION_LABEL: Record<LogAction, string> = {
  hide_content: "콘텐츠 숨김",
  unhide_content: "숨김 해제",
  suspend_user: "유저 정지",
  unsuspend_user: "정지 해제",
  update_report: "제보 처리",
  publish_notice: "공지 게시",
  delete_notice: "공지 삭제",
  delete_image: "이미지 삭제",
}
