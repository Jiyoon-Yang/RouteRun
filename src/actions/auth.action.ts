'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

function isRelativePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

/**
 * Google OAuth URL을 발급하고 브라우저를 Google 로그인 페이지로 리다이렉트한다.
 * 콜백은 /auth/callback?next={returnTo} 로 돌아온다.
 */
export async function signInWithGoogle(returnTo: string = '/'): Promise<{ error: string } | void> {
  const supabase = createClient();
  const origin = headers().get('origin') ?? '';
  const safeReturnTo = isRelativePath(returnTo) ? returnTo : '/';
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(safeReturnTo)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? 'OAuth URL 발급 실패' };
  }

  redirect(data.url);
}

/**
 * 익명 세션을 서버에서 생성하고 쿠키를 설정한 뒤 대상 경로로 리다이렉트한다.
 */
export async function signInAnonymously(returnTo: string = '/'): Promise<{ error: string } | void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    return { error: error.message };
  }

  const safeReturnTo = isRelativePath(returnTo) ? returnTo : '/';
  redirect(safeReturnTo);
}

/**
 * 현재 세션을 종료하고 로그인 페이지로 리다이렉트한다.
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
