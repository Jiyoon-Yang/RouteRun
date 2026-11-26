import { USER_RECENT_LIMIT } from "@/commons/constants/content"
import type {
  ContentKind,
  User,
  UserContent,
  UserDetail,
  UserFilters,
  UserList,
} from "@/commons/types/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchUserReports } from "@/repositories/report.repository"
import {
  countUserLikes,
  fetchAuthUser,
  fetchUserContents,
  fetchUsers,
  type UserContentRow,
  type UserRow,
} from "@/repositories/user.repository"
import { toReport } from "@/services/report.service"

const toUser = (row: UserRow): User => ({
  id: row.id,
  nickname: row.nickname ?? "알 수 없음",
  isAnonymous: row.is_anonymous,
  avatarUrl: row.profile_image_url,
  joinedAt: row.created_at,
})

const toUserContent =
  (kind: ContentKind) =>
  (row: UserContentRow): UserContent => ({
    id: row.id,
    kind,
    title: row.title,
    region: row.start_address_region,
    distanceMeters: row.distance_meters ?? 0,
    likes: row.likes_count ?? 0,
    isHidden: row.is_hidden,
    createdAt: row.created_at,
  })

/** 조건에 맞는 유저 한 페이지. Service Role로 읽으므로 호출 전에 `requireAdmin()`을 거친다. */
export async function getUsers(filters: UserFilters): Promise<UserList> {
  const { rows, total } = await fetchUsers(createAdminClient(), filters)
  return { items: rows.map(toUser), total }
}

/** 이메일·최근 로그인, 활동 수, 최근 작성글·제보. 호출 전에 `requireAdmin()`을 거친다. */
export async function getUserDetail(userId: string): Promise<UserDetail> {
  const supabase = createAdminClient()
  const [auth, courses, tracks, likeCount, reports] = await Promise.all([
    fetchAuthUser(supabase, userId),
    fetchUserContents(supabase, "routes", userId, USER_RECENT_LIMIT),
    fetchUserContents(supabase, "tracks", userId, USER_RECENT_LIMIT),
    countUserLikes(supabase, userId),
    fetchUserReports(supabase, userId, USER_RECENT_LIMIT),
  ])

  // 코스·트랙을 각각 최근 N개씩 받아 섞은 뒤 다시 N개로 자른다.
  const written = [
    ...courses.rows.map(toUserContent("course")),
    ...tracks.rows.map(toUserContent("track")),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, USER_RECENT_LIMIT)

  return {
    ...auth,
    courseCount: courses.total,
    trackCount: tracks.total,
    likeCount,
    reportCount: reports.total,
    written,
    reports: reports.rows.map(toReport),
  }
}
