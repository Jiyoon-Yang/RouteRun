import { createClient } from '@/lib/supabase/client';

type TrackLikeRow = {
  track_id: string;
};

export async function fetchLikedTrackIds(
  userId: string,
  trackIds: string[],
): Promise<{ data: Set<string>; error: Error | null }> {
  if (trackIds.length === 0) {
    return { data: new Set(), error: null };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('track_likes')
    .select('track_id')
    .eq('user_id', userId)
    .in('track_id', trackIds)
    .returns<TrackLikeRow[]>();

  if (error) {
    return { data: new Set(), error: new Error(error.message) };
  }

  return { data: new Set((data ?? []).map((row) => row.track_id)), error: null };
}
