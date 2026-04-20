import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const AUTH_OPTIONS = {
  persistSession: false,
  autoRefreshToken: false,
} as const;

// 기본 클라이언트 생성 함수
export function createSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: AUTH_OPTIONS,
  });
}

// 기본 클라이언트 싱글톤 인스턴스
export const supabase: SupabaseClient = createSupabaseClient();

// 토큰 기반 클라이언트 생성 함수
export function createSupabaseClientWithToken(accessToken: string): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: AUTH_OPTIONS,
  });
}
