import type {
  Content,
  ContentFilters,
  ContentKind,
  ContentList,
} from "@/commons/types/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { logAdminAction } from "@/repositories/admin-log.repository"
import {
  fetchContents,
  updateHidden,
  type ContentRow,
} from "@/repositories/content.repository"
import { fetchRegions } from "@/repositories/dashboard.repository"

const TABLE = { course: "routes", track: "tracks" } as const
const LABEL: Record<ContentKind, string> = { course: "코스", track: "트랙" }

const toContent =
  (kind: ContentKind) =>
  (row: ContentRow): Content => ({
    id: row.id,
    kind,
    title: row.title,
    description: row.description ?? "",
    region: row.start_address_region,
    distanceMeters: row.distance_meters ?? 0,
    likes: row.likes_count ?? 0,
    imageUrls: row.image_urls ?? [],
    createdAt: row.created_at,
    isHidden: row.is_hidden,
    author: {
      nickname: row.users?.nickname ?? "알 수 없음",
      isAnonymous: row.users?.is_anonymous ?? false,
    },
  })

/** 숨긴 글을 포함해 조건에 맞는 코스·트랙 한 페이지. Service Role로 읽으므로 호출 전에 `requireAdmin()`을 거친다. */
export async function getContents({
  kind,
  ...filters
}: ContentFilters): Promise<ContentList> {
  const { rows, total } = await fetchContents(
    createAdminClient(),
    TABLE[kind],
    filters
  )
  return { items: rows.map(toContent(kind)), total }
}

/** 지역 필터 목록. 숨긴 글의 지역도 넣는다. */
export async function getContentRegions(kind: ContentKind): Promise<string[]> {
  const regions = await fetchRegions(createAdminClient(), TABLE[kind], {
    includeHidden: true,
  })
  return [...new Set(regions)].sort()
}

/** 숨기거나 되돌리고, 실제로 바뀐 글마다 조치 기록을 남긴다. */
export async function setContentHidden(
  adminId: string,
  kind: ContentKind,
  ids: string[],
  isHidden: boolean,
  reason: string | null
): Promise<void> {
  const supabase = createAdminClient()
  const changed = await updateHidden(supabase, TABLE[kind], ids, isHidden)

  // 숨김은 이미 반영됐으니 기록 실패로 화면에 실패를 띄우지 않는다(다시 누르면 바뀐 행이 없어 기록도 안 남는다).
  // 대신 빠진 기록을 서버 로그로 되살릴 수 있게 글 id를 남긴다.
  const results = await Promise.allSettled(
    changed.map((row) =>
      logAdminAction(supabase, {
        adminId,
        action: isHidden ? "hide_content" : "unhide_content",
        // 같은 제목을 구분하려고 제보 기록과 같은 8자리 id를 붙인다.
        target: `${LABEL[kind]} '${row.title}' (#${row.id.slice(0, 8)})`,
        reason,
      })
    )
  )
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        "[setContentHidden] 조치 기록 실패:",
        { kind, id: changed[index].id, isHidden, reason },
        result.reason
      )
    }
  })
}
