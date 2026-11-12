import type { SupabaseClient } from "@supabase/supabase-js"

import { COURSE_IMAGES_BUCKET } from "@/commons/utils/storage"
import type { ContentTable } from "@/repositories/dashboard.repository"

export type ImagePostRow = {
  id: string
  title: string
  image_urls: string[]
  is_hidden: boolean
  created_at: string
}

/** 사진이 한 장 이상 있는 글. 숨긴 글도 포함한다. */
export async function fetchImagePosts(
  supabase: SupabaseClient,
  table: ContentTable
): Promise<ImagePostRow[]> {
  // shortcut: PostgREST 기본 1000행까지만 온다, 사진 있는 글이 1000개에 가까워지면 페이지네이션
  const { data, error } = await supabase
    .from(table)
    .select("id, title, image_urls, is_hidden, created_at")
    // 빈 배열과 null(비교 결과가 null이라 빠진다)을 같이 거른다.
    .neq("image_urls", "{}")
    .order("created_at", { ascending: false })
    .order("id")

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return data
}

/** 사진을 지우기 직전에 글의 현재 사진 목록을 다시 읽는다. 없으면 null. */
export async function fetchPostImages(
  supabase: SupabaseClient,
  table: ContentTable,
  id: string
): Promise<{
  id: string
  title: string
  image_urls: string[] | null
} | null> {
  const { data, error } = await supabase
    .from(table)
    .select("id, title, image_urls")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return data
}

/** 이 글 말고 다른 코스·트랙도 쓰고 있는 사진 URL. */
export async function fetchSharedImageUrls(
  supabase: SupabaseClient,
  urls: string[],
  exclude: { table: ContentTable; id: string }
): Promise<Set<string>> {
  const tables: ContentTable[] = ["routes", "tracks"]
  const rows = await Promise.all(
    tables.map(async (table) => {
      let request = supabase
        .from(table)
        .select("image_urls")
        .overlaps("image_urls", urls)
      if (table === exclude.table) request = request.neq("id", exclude.id)
      const { data, error } = await request

      if (error) {
        throw new Error(`${table}: ${error.message}`)
      }
      return data as { image_urls: string[] }[]
    })
  )

  return new Set(
    rows
      .flat()
      .flatMap((row) => row.image_urls)
      .filter((url) => urls.includes(url))
  )
}

export async function updateImageUrls(
  supabase: SupabaseClient,
  table: ContentTable,
  id: string,
  imageUrls: string[]
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .update({ image_urls: imageUrls })
    .eq("id", id)

  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }
}

/** 버킷에서 파일을 지운다. 이미 없는 파일은 오류 없이 넘어간다. */
export async function removeStorageFiles(
  supabase: SupabaseClient,
  paths: string[]
): Promise<void> {
  const { error } = await supabase.storage
    .from(COURSE_IMAGES_BUCKET)
    .remove(paths)

  if (error) {
    throw new Error(`storage: ${error.message}`)
  }
}
