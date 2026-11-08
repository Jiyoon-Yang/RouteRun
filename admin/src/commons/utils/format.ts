import { MOCK_NOW } from "@/commons/mocks"

// 서버(UTC)와 브라우저 시간대가 달라도 같은 문자열이 나오도록 시간대를 고정한다.
const dateTime = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

const date = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const time = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const formatTime = (iso: string) => time.format(new Date(iso))
export const formatDate = (iso: string) => date.format(new Date(iso))

// shortcut: 시안은 MOCK_NOW 기준. 실제 구현에서는 서버에서 받은 now를 넘긴다.
export function formatRelative(iso: string, now = MOCK_NOW) {
  const minutes = Math.round((Date.parse(now) - Date.parse(iso)) / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)}분 전`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}시간 전`
  if (minutes < 60 * 24 * 7) return `${Math.round(minutes / 60 / 24)}일 전`
  return formatDate(iso)
}

export function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`
}

export const formatNumber = (value: number) => value.toLocaleString("ko-KR")
