import type { SupabaseClient } from "@supabase/supabase-js"

import type { NoticeStatus } from "@/commons/types/admin"

export type NoticeRow = {
  id: string
  title: string
  body: string
  status: NoticeStatus
  pinned: boolean
  published_at: string | null
  updated_at: string
}

type NoticeWrite = Omit<NoticeRow, "id">

const NOTICE_SELECT =
  "id, title, body, status, pinned, published_at, updated_at"

export async function fetchNotices(
  supabase: SupabaseClient
): Promise<NoticeRow[]> {
  const { data, error } = await supabase
    .from("notices")
    .select(NOTICE_SELECT)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(`notices: ${error.message}`)
  }

  return data
}

export async function fetchNotice(
  supabase: SupabaseClient,
  id: string
): Promise<NoticeRow | null> {
  const { data, error } = await supabase
    .from("notices")
    .select(NOTICE_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`notices: ${error.message}`)
  }

  return data
}

export async function insertNotice(
  supabase: SupabaseClient,
  notice: NoticeWrite
): Promise<NoticeRow> {
  const { data, error } = await supabase
    .from("notices")
    .insert(notice)
    .select(NOTICE_SELECT)
    .single()

  if (error) {
    throw new Error(`notices: ${error.message}`)
  }

  return data
}

export async function updateNotice(
  supabase: SupabaseClient,
  id: string,
  notice: NoticeWrite
): Promise<NoticeRow> {
  const { data, error } = await supabase
    .from("notices")
    .update(notice)
    .eq("id", id)
    .select(NOTICE_SELECT)
    .single()

  if (error) {
    throw new Error(`notices: ${error.message}`)
  }

  return data
}

/** 고정을 모두 푼다. 고정은 1개만 허용(DB unique index)이라 새로 고정하기 전에 부른다. */
export async function unpinNotices(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from("notices")
    .update({ pinned: false })
    .eq("pinned", true)

  if (error) {
    throw new Error(`notices: ${error.message}`)
  }
}

/** 지운 공지를 돌려준다. 없는 id면 null. */
export async function deleteNotice(
  supabase: SupabaseClient,
  id: string
): Promise<NoticeRow | null> {
  const { data, error } = await supabase
    .from("notices")
    .delete()
    .eq("id", id)
    .select(NOTICE_SELECT)
    .maybeSingle()

  if (error) {
    throw new Error(`notices: ${error.message}`)
  }

  return data
}
