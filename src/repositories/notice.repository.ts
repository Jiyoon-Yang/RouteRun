import type { Notice } from '@/commons/types/routerun';

import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

const NOTICE_SELECT = 'id, title, body, pinned, published_at';

/** 게시된 공지. 고정 공지가 맨 위, 나머지는 최신 게시순. 초안은 RLS도 막는다 */
export async function getPublishedNotices(
  supabase: SupabaseClient,
): Promise<{ data: Notice[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('notices')
    .select(NOTICE_SELECT)
    .eq('status', 'published')
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false });

  return { data, error };
}
