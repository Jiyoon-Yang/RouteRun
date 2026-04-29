'use server';

// 코스 관련 Server Actions
// 예) 좋아요 누르기, 코스 등록 폼 제출

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { submitNewCourse, type SubmitCourseInput } from '@/services/course/courseService';

export type CreateCourseActionError = {
  success: false;
  message: string;
};

/**
 * 클라이언트 폼에서 전달한 코스 데이터로 새 코스를 등록한다.
 * 성공 시 홈 캐시를 갱신한 뒤 `/`로 이동한다.
 */
export async function createCourseAction(
  input: SubmitCourseInput,
): Promise<CreateCourseActionError | void> {
  const supabase = createClient();
  const { data, error } = await submitNewCourse(supabase, input);

  if (error || !data) {
    return {
      success: false,
      message: error?.message ?? '코스 등록에 실패했습니다.',
    };
  }

  revalidatePath('/');
  redirect('/');
}
