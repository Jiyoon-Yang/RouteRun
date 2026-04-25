// 유저 데이터 통신 전담
// Supabase와 통신하여 유저 데이터를 가져옴 (UI/Service에 Supabase 코드 금지)

import { createClient } from '@/lib/supabase/server';

import type { SupabaseClient } from '@supabase/supabase-js';

export type UserProfileRow = {
  nickname: string | null;
  profile_image_url: string | null;
};

/**
 * `users` 테이블에서 닉네임·프로필 이미지 URL을 조회한다.
 * 행이 없으면 `data`는 `null`이다.
 */
export async function getUserProfileById(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: UserProfileRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('users')
    .select('nickname, profile_image_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

export async function checkNicknameDuplicate(nickname: string): Promise<boolean> {
  const supabase = createClient();
  const normalizedNickname = nickname.trim();

  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('nickname', normalizedNickname);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}

export async function updateNickname(userId: string, newNickname: string): Promise<void> {
  const supabase = createClient();
  const normalizedNickname = newNickname.trim();

  const { error } = await supabase
    .from('users')
    .update({ nickname: normalizedNickname })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
