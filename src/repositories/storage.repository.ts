// Storage(`course_images` 버킷) 파일 삭제 전담
import { COURSE_IMAGES_BUCKET, extractCourseImagePath } from '@/commons/utils/storage';
import { createClient } from '@/lib/supabase/server';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 계정 삭제 시 사용자 폴더(`userId/`)의 이미지를 모두 지운다. Service Role 클라이언트를 주입받는다.
 * 계정은 이미 지워진 뒤라 실패해도 throw하지 않고 로그만 남긴다(남는 건 고아 파일뿐).
 */
export async function removeUserImageFolder(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const bucket = supabase.storage.from(COURSE_IMAGES_BUCKET);
  // list는 한 번에 일부만 주므로 빌 때까지 반복한다
  for (;;) {
    const { data: files, error } = await bucket.list(userId, { limit: 100 });
    if (error) {
      console.error('[storageRepository] 사용자 이미지 목록 조회 실패:', error.message);
      return;
    }
    if (!files?.length) return;

    const { data: removed, error: removeError } = await bucket.remove(
      files.map((file) => `${userId}/${file.name}`),
    );
    if (removeError) {
      console.error('[storageRepository] 사용자 이미지 삭제 실패:', removeError.message);
      return;
    }
    // 하나도 안 지워지면 같은 목록을 계속 받으므로 멈춘다
    if (!removed?.length) {
      console.warn(`[storageRepository] 사용자 이미지 ${files.length}개가 삭제되지 않음`);
      return;
    }
  }
}

/**
 * 게시글에서 빠진 이미지 파일을 버킷에서 지운다.
 * DB 변경이 이미 끝난 뒤 호출하므로, 실패해도 throw하지 않고 로그만 남긴다.
 */
export async function removeCourseImages(imageUrls: string[], userId: string): Promise<void> {
  const paths = imageUrls
    .map((url) => extractCourseImagePath(url, userId))
    .filter((path): path is string => path !== null);
  if (paths.length === 0) return;

  const supabase = createClient();
  const { data, error } = await supabase.storage.from(COURSE_IMAGES_BUCKET).remove(paths);

  if (error) {
    console.error('[storageRepository] 이미지 삭제 실패:', error.message);
    return;
  }
  // Storage RLS가 삭제를 허용하지 않으면 에러 없이 빈 결과가 온다.
  if ((data?.length ?? 0) < paths.length) {
    console.warn(
      `[storageRepository] 이미지 ${paths.length}개 중 ${data?.length ?? 0}개만 삭제됨 (Storage 삭제 정책 확인 필요)`,
    );
  }
}
