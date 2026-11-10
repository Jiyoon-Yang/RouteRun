import { type NextRequest, NextResponse } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  // 세션 없음만 막는다. 관리자 여부는 requireAdmin()이 확인한다.
  // 로그인한 사람을 /login에서 /로 보내면 관리자가 아닌 세션이 / ↔ /login을 무한 반복한다.
  if (!user && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
}
