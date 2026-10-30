import type { Report, ReportType } from '@/commons/types/routerun';

import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

const REPORT_SELECT = 'id, user_id, type, content, created_at';

type ReportRow = {
  id: string;
  user_id: string;
  type: string;
  content: string;
  created_at: string;
};

function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as ReportType,
    content: row.content,
    created_at: row.created_at,
  };
}

export async function createReport(
  supabase: SupabaseClient,
  payload: { user_id: string; type: ReportType; content: string },
): Promise<{ data: Report | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('reports')
    .insert(payload)
    .select(REPORT_SELECT)
    .single();

  if (error || !data) return { data: null, error };
  return { data: toReport(data as ReportRow), error: null };
}

/** `sinceIso` 이후 해당 유저가 접수한 제보 수 */
export async function countReportsByUserSince(
  supabase: SupabaseClient,
  userId: string,
  sinceIso: string,
): Promise<{ count: number | null; error: PostgrestError | null }> {
  const { count, error } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceIso);

  return { count, error };
}
