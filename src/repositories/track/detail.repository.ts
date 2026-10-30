import type { Track } from '@/commons/types/routerun';

import { TRACK_SELECT, toTrack, type TrackRow } from './track-row';

import type { SupabaseClient } from '@supabase/supabase-js';

export async function getTrackById(
  supabase: SupabaseClient,
  trackId: string,
): Promise<{ data: Track | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .eq('id', trackId)
    .maybeSingle<TrackRow>();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: toTrack(data ?? null), error: null };
}
