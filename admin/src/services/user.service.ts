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
import { logAdminAction } from "@/repositories/admin-log.repository"
import { fetchAuthors } from "@/repositories/dashboard.repository"
import { fetchUserReports } from "@/repositories/report.repository"
import {
  deleteSuspension,
  fetchActiveSuspensions,
  upsertSuspension,
} from "@/repositories/suspension.repository"
import {
  countUserLikes,
  fetchAuthUser,
  fetchUserContents,
  fetchUsers,
  type UserContentRow,
  type UserRow,
} from "@/repositories/user.repository"
import { toReport } from "@/services/report.service"

const DAY_MS = 24 * 60 * 60 * 1000

const toUser = (row: UserRow, isSuspended: boolean): User => ({
  id: row.id,
  nickname: row.nickname ?? "알 수 없음",
  isAnonymous: row.is_anonymous,
  avatarUrl: row.profile_image_url,
  joinedAt: row.created_at,
  isSuspended,
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

/** 조건에 맞는 유저 한 페이지와 정지 여부. Service Role로 읽으므로 호출 전에 `requireAdmin()`을 거친다. */
export async function getUsers(filters: UserFilters): Promise<UserList> {
  const supabase = createAdminClient()
  const { rows, total } = await fetchUsers(supabase, filters)
  const suspensions = await fetchActiveSuspensions(
    supabase,
    rows.map((row) => row.id)
  )
  const suspended = new Set(suspensions.map((row) => row.user_id))

  return {
    items: rows.map((row) => toUser(row, suspended.has(row.id))),
    total,
  }
}

/** 이메일·최근 로그인, 활동 수, 최근 작성글·제보, 걸려 있는 정지. 호출 전에 `requireAdmin()`을 거친다. */
export async function getUserDetail(userId: string): Promise<UserDetail> {
  const supabase = createAdminClient()
  const [auth, courses, tracks, likeCount, reports, [suspension]] =
    await Promise.all([
      fetchAuthUser(supabase, userId),
      fetchUserContents(supabase, "routes", userId, USER_RECENT_LIMIT),
      fetchUserContents(supabase, "tracks", userId, USER_RECENT_LIMIT),
      countUserLikes(supabase, userId),
      fetchUserReports(supabase, userId, USER_RECENT_LIMIT),
      fetchActiveSuspensions(supabase, [userId]),
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
    suspension: suspension
      ? { until: suspension.until, reason: suspension.reason }
      : null,
  }
}

/** 조치 기록에 남길 유저 표시. 같은 닉네임을 구분하려고 8자리 id를 붙인다. 없는 유저면 throw. */
async function describeUser(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const [author] = await fetchAuthors(supabase, [userId])
  if (!author) throw new Error(`users: ${userId} 없음`)
  return `유저 '${author.nickname ?? "알 수 없음"}' (#${userId.slice(0, 8)})`
}

/** 정지를 건다(days 0은 영구). 끝나는 시각은 서버 시계로 정한다. */
export async function suspendUser(
  adminId: string,
  userId: string,
  days: number,
  reason: string
): Promise<void> {
  const supabase = createAdminClient()
  const target = await describeUser(supabase, userId)
  await upsertSuspension(supabase, {
    user_id: userId,
    until: days ? new Date(Date.now() + days * DAY_MS).toISOString() : null,
    reason,
  })

  // shortcut: 정지와 기록이 트랜잭션이 아님, 기록이 빠지면 안 되면 RPC로 묶는다
  // 정지는 이미 반영됐으니 기록 실패로 화면에 실패를 띄우지 않는다.
  await logAdminAction(supabase, {
    adminId,
    action: "suspend_user",
    target: `${target} ${days ? `${days}일` : "영구"}`,
    reason,
  }).catch((error) =>
    console.error("[suspendUser] 조치 기록 실패:", { userId, days }, error)
  )
}

/** 정지를 푼다. 실제로 지운 정지가 있을 때만 기록한다. */
export async function unsuspendUser(
  adminId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient()
  const target = await describeUser(supabase, userId)
  if (!(await deleteSuspension(supabase, userId))) return

  await logAdminAction(supabase, {
    adminId,
    action: "unsuspend_user",
    target,
    reason: null,
  }).catch((error) =>
    console.error("[unsuspendUser] 조치 기록 실패:", { userId }, error)
  )
}
