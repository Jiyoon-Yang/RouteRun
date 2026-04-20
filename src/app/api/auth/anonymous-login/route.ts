import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseClient } from '@/lib/supabase/initialize';

function isRelativePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

// POST: 익명 로그인 처리 및 토큰 반환
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const returnTo = isRelativePath(body.returnTo) ? body.returnTo : null;

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const accessToken = data.session?.access_token;
    const refreshToken = data.session?.refresh_token;

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: '토큰 발급 실패' }, { status: 500 });
    }

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      ...(returnTo ? { returnTo } : {}),
    });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
