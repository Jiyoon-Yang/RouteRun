import { NextRequest, NextResponse } from 'next/server';

import { SIGNUP_COOKIE, SIGNUP_COOKIE_OPTIONS } from '@/commons/constants/analytics';
import { createClient } from '@/lib/supabase/server';

// 구글 계정은 Supabase 콜백에서 만들어지고 몇 초 안에 이 라우트로 돌아온다
const NEW_USER_WINDOW_MS = 60 * 1000;

function isRelativePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const next = isRelativePath(rawNext) ? rawNext : '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.is_anonymous === false) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_anonymous: false })
          .eq('id', user.id);

        if (updateError) {
          console.error('Failed to update user anonymity status:', updateError);
        }
      }

      const response = NextResponse.redirect(new URL(next, request.url));

      // 방금 만들어진 구글 계정만 가입으로 센다(재로그인·게스트 연동 제외)
      if (
        user &&
        user.is_anonymous === false &&
        Date.now() - new Date(user.created_at).getTime() < NEW_USER_WINDOW_MS
      ) {
        response.cookies.set(SIGNUP_COOKIE, 'google', SIGNUP_COOKIE_OPTIONS);
      }

      return response;
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
