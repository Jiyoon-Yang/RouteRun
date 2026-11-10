import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/repositories/admin.repository"

/**
 * 관리자 세션이 아니면 `/login`으로 보낸다. `(admin)` 레이아웃과 모든 Server Action에서 호출한다.
 * 레이아웃은 클라이언트 이동 때 다시 실행되지 않고 액션은 직접 호출될 수 있어서, 레이아웃 검사만으로는 부족하다.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(supabase, user.id))) {
    redirect("/login")
  }

  return user
}
