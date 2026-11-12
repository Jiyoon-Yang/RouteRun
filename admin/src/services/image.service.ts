import { IMAGE_PAGE_SIZE } from "@/commons/constants/content"
import type {
  ContentKind,
  ImageFilters,
  ImageList,
  ImageTarget,
} from "@/commons/types/admin"
import { extractImagePath } from "@/commons/utils/storage"
import { createAdminClient } from "@/lib/supabase/admin"
import { logAdminAction } from "@/repositories/admin-log.repository"
import {
  fetchImagePosts,
  fetchPostImages,
  fetchSharedImageUrls,
  removeStorageFiles,
  updateImageUrls,
} from "@/repositories/image.repository"

const TABLE = { course: "routes", track: "tracks" } as const
const LABEL: Record<ContentKind, string> = { course: "코스", track: "트랙" }

/** 사진을 한 장씩 펼쳐 최근 글 순으로 한 페이지. Service Role로 읽으므로 호출 전에 `requireAdmin()`을 거친다. */
export async function getImages({
  kind,
  page,
}: ImageFilters): Promise<ImageList> {
  const supabase = createAdminClient()
  const kinds: ContentKind[] = kind === "all" ? ["course", "track"] : [kind]
  const posts = await Promise.all(
    kinds.map((kind) => fetchImagePosts(supabase, TABLE[kind]))
  )

  const images = kinds
    .flatMap((kind, index) =>
      posts[index].flatMap((post) =>
        post.image_urls.map((url) => ({
          url,
          kind,
          contentId: post.id,
          title: post.title,
          isHidden: post.is_hidden,
          createdAt: post.created_at,
        }))
      )
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // shortcut: 사진 있는 글을 전부 받아 여기서 20장씩 자른다(사진은 image_urls 배열 안에 있어 DB에서 장 단위로 못 자른다), 사진 있는 글이 1000개에 가까워지면 image_urls를 펼친 view + range로 바꾼다
  const from = (page - 1) * IMAGE_PAGE_SIZE
  return {
    items: images.slice(from, from + IMAGE_PAGE_SIZE),
    total: images.length,
  }
}

/**
 * 사진을 스토리지와 글의 image_urls에서 지우고, 글마다 조치 기록을 남긴다. 지운 사진 수를 돌려준다.
 * 글을 하나씩 처리하다 실패하면 throw한다. 그 앞의 글은 이미 반영돼 있다.
 */
export async function deleteImages(
  adminId: string,
  targets: ImageTarget[],
  reason: string
): Promise<number> {
  const supabase = createAdminClient()
  const byPost = Map.groupBy(
    targets,
    (target) => `${target.kind}:${target.contentId}`
  )
  let deleted = 0

  for (const group of byPost.values()) {
    const { kind, contentId } = group[0]
    const post = await fetchPostImages(supabase, TABLE[kind], contentId)
    const current = post?.image_urls ?? []
    // 글에 실제로 있는 URL만 지운다. 액션을 직접 불러도 버킷의 다른 파일은 건드리지 못한다.
    const urls = current.filter((url) =>
      group.some((target) => target.url === url)
    )
    if (!post || urls.length === 0) continue

    // 스토리지를 먼저 지운다. 아래 DB 갱신이 실패해도 URL이 글에 남아 다시 누르면 다시 시도된다.
    // 반대 순서면 스토리지 실패 시 어디에도 안 걸린 파일이 공개 URL로 남는다.
    // 다른 호스트의 URL은 우리 버킷에 파일이 없어 글에서만 뺀다.
    // 다른 글도 쓰는 파일은 남기고 이 글에서만 뺀다. 마지막으로 쓰는 글에서 지울 때 파일도 지운다.
    const shared = await fetchSharedImageUrls(supabase, urls, {
      table: TABLE[kind],
      id: contentId,
    })
    const paths = urls
      .filter((url) => !shared.has(url))
      .map(extractImagePath)
      .filter((path): path is string => path !== null)
    if (paths.length > 0) await removeStorageFiles(supabase, paths)

    // shortcut: 읽고 쓰는 사이에 작성자가 글을 수정하면 그 수정을 덮어쓴다, 조치가 잦아지면 array_remove RPC로 바꾼다
    await updateImageUrls(
      supabase,
      TABLE[kind],
      contentId,
      current.filter((url) => !urls.includes(url))
    )
    deleted += urls.length

    // 사진은 이미 지워졌으니 기록 실패로 화면에 실패를 띄우지 않는다. 빠진 기록을 되살릴 수 있게 서버 로그에 남긴다.
    await logAdminAction(supabase, {
      adminId,
      action: "delete_image",
      // 같은 제목을 구분하려고 다른 기록과 같은 8자리 id를 붙인다.
      target: `${LABEL[kind]} '${post.title}' (#${post.id.slice(0, 8)}) 사진 ${urls.length}장`,
      reason,
    }).catch((error) => {
      console.error(
        "[deleteImages] 조치 기록 실패:",
        { kind, id: contentId, urls, reason },
        error
      )
    })
  }

  return deleted
}
