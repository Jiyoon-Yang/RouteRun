import type { Notice } from '@/commons/types/routerun';
import { getPublishedNotices } from '@/repositories/notice.repository';

import type { SupabaseClient } from '@supabase/supabase-js';

/** 공지사항 페이지용 게시 공지. 조회에 실패하면 빈 목록을 돌려 "공지 없음"으로 보인다 */
export async function fetchNotices(supabase: SupabaseClient): Promise<Notice[]> {
  const { data, error } = await getPublishedNotices(supabase);
  if (error) {
    console.error('[fetchNotices]', error.message);
    return [];
  }
  return data ?? [];
}
