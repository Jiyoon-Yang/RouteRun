'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { changeNickname, checkNicknameAvailable } from '@/services/user/userService';
import { validateNickname } from '@/services/user/userValidation';

export type CheckNicknameActionResult = {
  isAvailable: boolean;
  message: string;
};

export type UpdateNicknameActionResult = {
  success: boolean;
  message: string;
};

export async function checkNicknameAction(nickname: string): Promise<CheckNicknameActionResult> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      isAvailable: false,
      message: '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.',
    };
  }

  const normalizedNickname = nickname.trim();
  const validation = validateNickname(normalizedNickname);
  if (!validation.isValid) {
    return {
      isAvailable: false,
      message: validation.message ?? '유효하지 않은 닉네임입니다.',
    };
  }

  const isAvailable = await checkNicknameAvailable(normalizedNickname);

  return {
    isAvailable,
    message: isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.',
  };
}

export async function updateNicknameAction(
  newNickname: string,
): Promise<UpdateNicknameActionResult> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      message: '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.',
    };
  }

  try {
    await changeNickname(user.id, newNickname);
    revalidatePath('/mypage');
    return { success: true, message: '닉네임이 변경되었습니다.' };
  } catch (actionError) {
    return {
      success: false,
      message: actionError instanceof Error ? actionError.message : '닉네임 변경에 실패했습니다.',
    };
  }
}
