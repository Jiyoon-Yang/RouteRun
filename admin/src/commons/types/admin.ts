// 어드민 화면이 다루는 도메인 타입. 실데이터 연결 시 Repository의 Row → 이 타입으로 변환한다.

export type ReportType = "bug" | "inconvenience" | "suggestion"
export type ReportStatus = "open" | "in_progress" | "resolved"

export type User = {
  id: string
  nickname: string
  isAnonymous: boolean
  email: string | null
  avatarUrl: string | null
  joinedAt: string
  lastSeenAt: string
  courseCount: number
  trackCount: number
  likeCount: number
  reportCount: number
  suspendedUntil: string | null
  suspendReason: string | null
}

// 0~1로 정규화한 경로 좌표. 실제로는 routes.path_data를 같은 형태로 변환해 쓴다.
export type PathPoint = [number, number]

export type ContentKind = "course" | "track"

export type Content = {
  id: string
  kind: ContentKind
  title: string
  description: string
  region: string
  distanceMeters: number
  likes: number
  imageUrls: string[]
  authorId: string
  createdAt: string
  isHidden: boolean
  isRoundTrip: boolean | null
  path: PathPoint[] | null
}

export type Report = {
  id: string
  userId: string
  type: ReportType
  content: string
  createdAt: string
  status: ReportStatus
  adminNote: string
}

export type NoticeStatus = "published" | "draft"

export type Notice = {
  id: string
  title: string
  body: string
  status: NoticeStatus
  pinned: boolean
  publishedAt: string | null
  updatedAt: string
}

export type LogAction =
  | "hide_content"
  | "unhide_content"
  | "suspend_user"
  | "unsuspend_user"
  | "update_report"
  | "publish_notice"
  | "delete_image"

export type AuditLog = {
  id: string
  admin: string
  action: LogAction
  target: string
  reason: string | null
  at: string
}

export type ContentImage = {
  id: string
  url: string
  contentId: string
  uploadedAt: string
}

// 대시보드 검색 유입 카드. 구글 수치는 Search Console, 검색엔진별 방문은 GA4(네이버는 이걸로 본다).
export type SearchStats = {
  totals: { clicks: number; impressions: number; ctr: number; position: number }
  daily: { date: string; clicks: number; impressions: number }[]
  queries: {
    query: string
    clicks: number
    impressions: number
    position: number
  }[]
  organicSessions: { source: string; sessions: number }[]
}
