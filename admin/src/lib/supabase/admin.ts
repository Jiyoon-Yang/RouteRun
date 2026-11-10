import "server-only"

import { createClient } from "@supabase/supabase-js"

/**
 * RLS를 우회하는 Service Role 클라이언트. 여러 유저의 데이터를 집계할 때만 쓴다.
 * 키는 이 파일에서만 읽고, 호출부는 반드시 `requireAdmin()`을 먼저 거친다.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
