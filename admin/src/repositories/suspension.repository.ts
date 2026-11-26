import type { SupabaseClient } from "@supabase/supabase-js"

export type SuspensionRow = {
  user_id: string
  until: string | null
  reason: string
}

/** 지금 걸려 있는(영구이거나 아직 안 끝난) 정지. 끝난 행은 남아 있어도 뺀다. */
export async function fetchActiveSuspensions(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<SuspensionRow[]> {
  if (userIds.length === 0) return []

  const { data, error } = await supabase
    .from("user_suspensions")
    .select("user_id, until, reason")
    .in("user_id", userIds)
    .or(`until.is.null,until.gt.${new Date().toISOString()}`)

  if (error) {
    throw new Error(`user_suspensions: ${error.message}`)
  }

  return data
}

/** 정지를 건다. 끝난 정지가 남아 있으면 새 기간·사유로 덮는다. */
export async function upsertSuspension(
  supabase: SupabaseClient,
  row: SuspensionRow
): Promise<void> {
  const { error } = await supabase
    .from("user_suspensions")
    .upsert({ ...row, created_at: new Date().toISOString() })

  if (error) {
    throw new Error(`user_suspensions: ${error.message}`)
  }
}

/** 정지를 푼다. 지운 행이 있으면 true. */
export async function deleteSuspension(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_suspensions")
    .delete()
    .eq("user_id", userId)
    .select("user_id")

  if (error) {
    throw new Error(`user_suspensions: ${error.message}`)
  }

  return data.length > 0
}
