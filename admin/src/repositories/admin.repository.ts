import type { SupabaseClient } from "@supabase/supabase-js"

/** `admins`에 행이 있는지. RLS가 본인 행만 보여주므로 로그인한 유저의 클라이언트로 호출한다. */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data !== null
}
