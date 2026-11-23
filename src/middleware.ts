import { NextResponse } from 'next/server';

import { PRIVATE_DYNAMIC_PATTERNS, PRIVATE_ROUTES, ROUTES } from '@/commons/constants/url';
import { shouldRedirectToAgree } from '@/commons/utils/terms-consent';
import { updateSession } from '@/lib/supabase/middleware';

import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname, search } = request.nextUrl;

  const isPrivate =
    (PRIVATE_ROUTES as readonly string[]).some((route) => route === pathname) ||
    PRIVATE_DYNAMIC_PATTERNS.some((pattern) => pattern.test(pathname));

  // private 라우트는 "세션 없음"만 차단한다. (게스트 세션은 허용)
  if (isPrivate && !user) {
    const loginUrl = new URL('/login', request.url);
    const redirectTo = `${pathname}${search}`;
    loginUrl.searchParams.set('next', redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  // 로그인했지만 약관에 동의하지 않았으면(신규·기존 회원, 게스트 모두) 동의 화면으로 한 번 보낸다
  if (shouldRedirectToAgree(user, pathname, request.method)) {
    const agreeUrl = new URL(ROUTES.AGREE, request.url);
    agreeUrl.searchParams.set('next', `${pathname}${search}`);
    const response = NextResponse.redirect(agreeUrl);
    // 이번 요청에서 갱신된 세션 쿠키를 리다이렉트 응답에도 실어야 로그아웃되지 않는다
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 정적 에셋 및 내부 Next.js 경로를 제외한 모든 요청에 미들웨어를 적용한다.
     * - _next/static, _next/image: Next.js 내부 파일
     * - favicon.ico: 파비콘
     * - 이미지/폰트 확장자
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
