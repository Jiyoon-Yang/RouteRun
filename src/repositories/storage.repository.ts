// Storage(`course_images` 버킷) 파일 삭제 전담
import { COURSE_IMAGES_BUCKET, extractCourseImagePath } from '@/commons/utils/storage';
import { createClient } from '@/lib/supabase/server';

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
