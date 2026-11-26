// 시안 전용 목데이터. 실제 구현에서는 Repository 조회 결과로 대체하고 이 파일은 지운다.
// 서버/클라이언트 렌더 결과가 같아야 하므로 Math.random·Date.now를 쓰지 않는다.

import type { AuditLog } from "@/commons/types/admin"

export const MOCK_NOW = "2026-11-03T12:00:00+09:00"

export const ADMINS = ["admin@example.com", "ops@example.com"]

export const logs: AuditLog[] = [
  {
    id: "l-14",
    admin: ADMINS[0],
    action: "update_report",
    target: "제보 #29 → 처리중",
    reason: "태그 기능 백로그 추가",
    at: "2026-11-03T09:40:00+09:00",
  },
  {
    id: "l-13",
    admin: ADMINS[0],
    action: "delete_image",
    target: "코스 '석촌호수 3바퀴' 이미지 1장",
    reason: "얼굴이 크게 나온 타인 사진",
    at: "2026-11-03T09:05:00+09:00",
  },
  {
    id: "l-12",
    admin: ADMINS[1],
    action: "update_report",
    target: "제보 #28 → 처리중",
    reason: null,
    at: "2026-11-02T22:10:00+09:00",
  },
  {
    id: "l-11",
    admin: ADMINS[0],
    action: "publish_notice",
    target: "공지 '게스트 작성 제한 안내'",
    reason: null,
    at: "2026-11-01T10:00:00+09:00",
  },
  {
    id: "l-10",
    admin: ADMINS[1],
    action: "suspend_user",
    target: "유저 '광고왕' (30일)",
    reason: "코스 설명에 홍보 링크 반복 게시",
    at: "2026-10-30T09:20:00+09:00",
  },
  {
    id: "l-9",
    admin: ADMINS[1],
    action: "hide_content",
    target: "트랙 '러닝크루 모집 오픈채팅 →'",
    reason: "홍보성 게시물",
    at: "2026-10-30T09:18:00+09:00",
  },
  {
    id: "l-8",
    admin: ADMINS[1],
    action: "hide_content",
    target: "코스 '★최저가 러닝화 여기서★ 망원 코스'",
    reason: "홍보성 게시물",
    at: "2026-10-30T09:17:00+09:00",
  },
  {
    id: "l-7",
    admin: ADMINS[0],
    action: "unhide_content",
    target: "코스 '서울숲-응봉산 트레일'",
    reason: "오신고, 문제 없음",
    at: "2026-10-29T14:00:00+09:00",
  },
  {
    id: "l-6",
    admin: ADMINS[0],
    action: "hide_content",
    target: "코스 '서울숲-응봉산 트레일'",
    reason: "경로가 사유지 통과 의심",
    at: "2026-10-29T11:30:00+09:00",
  },
  {
    id: "l-5",
    admin: ADMINS[0],
    action: "update_report",
    target: "제보 #26 → 완료",
    reason: "트리거 반영으로 해결",
    at: "2026-10-29T10:00:00+09:00",
  },
  {
    id: "l-4",
    admin: ADMINS[1],
    action: "update_report",
    target: "제보 #25 → 완료",
    reason: null,
    at: "2026-10-28T16:45:00+09:00",
  },
  {
    id: "l-3",
    admin: ADMINS[0],
    action: "unsuspend_user",
    target: "유저 '게스트_55aa'",
    reason: "기간 만료 전 수동 해제",
    at: "2026-10-27T12:00:00+09:00",
  },
]

// 최근 30일 일별 추이. 사인파로 만든 고정값.
export const dailyStats = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 9, 5 + i))
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
  return {
    date: date.toISOString().slice(0, 10),
    signups: Math.round(14 + Math.sin(i / 3) * 5 + i * 0.4 + (weekend ? 6 : 0)),
    guests: Math.round(9 + Math.cos(i / 4) * 4 + (weekend ? 5 : 0)),
    courses: Math.round(4 + Math.sin(i / 2.5) * 2 + (weekend ? 4 : 0)),
    tracks: Math.round(1 + Math.abs(Math.sin(i / 5)) * 2),
  }
})

export const regionStats = [
  { region: "송파구", courses: 34, tracks: 6 },
  { region: "마포구", courses: 29, tracks: 3 },
  { region: "서초구", courses: 24, tracks: 4 },
  { region: "영등포구", courses: 21, tracks: 5 },
  { region: "성동구", courses: 17, tracks: 2 },
  { region: "강남구", courses: 15, tracks: 3 },
  { region: "종로구", courses: 11, tracks: 1 },
]

export const totals = {
  users: 1284,
  guests: 412,
  courses: 187,
  tracks: 39,
  likes: 5236,
  newUsersThisWeek: 96,
  newContentThisWeek: 31,
}
