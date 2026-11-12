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

// 코스·트랙 관리 목록 한 행. 작성자는 users 임베드로 같이 받는다.
export type Content = {
  id: string
  kind: ContentKind
  title: string
  description: string
  region: string | null
  distanceMeters: number
  likes: number
  imageUrls: string[]
  createdAt: string
  isHidden: boolean
  author: { nickname: string; isAnonymous: boolean }
}

// 코스·트랙 목록 조회 조건. region·visibility의 "all"은 거르지 않는다는 뜻.
export type ContentFilters = {
  kind: ContentKind
  region: string
  visibility: "all" | "visible" | "hidden"
  query: string
  page: number
}

// 한 페이지 글과 조건에 맞는 전체 글 수.
export type ContentList = { items: Content[]; total: number }

export type Report = {
  id: string
  userId: string
  type: ReportType
  content: string
  createdAt: string
  status: ReportStatus
  adminNote: string
  handledAt: string | null
}

// 제보 처리함에 보이는 신고자 정보. 제보 수는 화면이 목록에서 센다.
export type Reporter = Pick<
  User,
  "nickname" | "isAnonymous" | "avatarUrl" | "courseCount" | "trackCount"
>

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

// 작성 다이얼로그가 다루는 값. 상태·게시일은 저장할 때 서버가 정한다.
export type NoticeDraft = Pick<Notice, "title" | "body" | "pinned">

export type LogAction =
  | "hide_content"
  | "unhide_content"
  | "suspend_user"
  | "unsuspend_user"
  | "update_report"
  | "publish_notice"
  | "delete_notice"
  | "delete_image"

export type AuditLog = {
  id: string
  admin: string
  action: LogAction
  target: string
  reason: string | null
  at: string
}

// 이미지 검수 갤러리 한 장. 글의 image_urls를 펼친 것이라 업로드 시각 대신 글 등록 시각을 쓴다.
export type ContentImage = {
  url: string
  kind: ContentKind
  contentId: string
  title: string
  isHidden: boolean
  createdAt: string
}

// 이미지 검수 조회 조건. kind의 "all"은 코스·트랙을 같이 본다는 뜻.
export type ImageFilters = { kind: ContentKind | "all"; page: number }

// 한 페이지 사진과 조건에 맞는 전체 사진 수.
export type ImageList = { items: ContentImage[]; total: number }

// 삭제할 사진. 같은 URL이 두 글에 있을 수 있어서 글까지 짚는다.
export type ImageTarget = Pick<ContentImage, "kind" | "contentId" | "url">

// 대시보드 지표. weekly는 최근 7일 증가분, daily는 최근 30일(KST 날짜별).
// 코스·트랙 수·지역·최근 등록은 숨긴 글을 빼고 세고, 숨긴 수는 hidden에 따로 둔다.
// users = google + guests. google은 is_anonymous=false라 게스트가 구글로 전환하면 google로 옮겨 간다.
type DashboardCounts = {
  users: number
  google: number
  guests: number
  courses: number
  tracks: number
}

export type DashboardStats = {
  totals: DashboardCounts
  weekly: DashboardCounts
  hidden: { courses: number; tracks: number }
  daily: { date: string; signups: number; guests: number }[]
  regions: { region: string; courses: number; tracks: number }[]
  recent: {
    id: string
    kind: ContentKind
    title: string
    region: string | null
    likes: number
    createdAt: string
    author: { nickname: string; isAnonymous: boolean }
  }[]
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
