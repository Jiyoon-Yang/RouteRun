import type { Track } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/server';

import type { SupabaseClient } from '@supabase/supabase-js';

type TrackRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  distance_meters: number | null;
  start_lat: number | null;
  start_lng: number | null;
  start_address_region: string | null;
  image_urls: string[] | null;
  likes_count: number | null;
  created_at: string | null;
};

const TRACK_SELECT =
  'id, user_id, title, description, distance_meters, start_lat, start_lng, start_address_region, image_urls, likes_count, created_at';

function toTrack(row: TrackRow): Track | null {
  if (
    !row.id ||
    !row.user_id ||
    !row.title ||
    row.distance_meters === null ||
    row.start_lat === null ||
    row.start_lng === null ||
    !row.created_at
  ) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    distance_meters: row.distance_meters,
    start_lat: row.start_lat,
    start_lng: row.start_lng,
    start_address_region: row.start_address_region,
    image_urls: row.image_urls ?? [],
    likes_count: row.likes_count ?? 0,
    created_at: row.created_at,
  };
}

function normalizeTrackRows(rows: TrackRow[] | null): Track[] {
  return (rows ?? []).map(toTrack).filter((track): track is Track => track !== null);
}

export interface InsertTrackParams {
  user_id: string;
  title: string;
  description: string | null;
  distance_meters: number;
  start_lat: number;
  start_lng: number;
  start_address_region?: string | null;
  image_urls: string[];
}

export async function createTrack(
  supabase: SupabaseClient,
  params: InsertTrackParams,
): Promise<{ data: Track | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('tracks')
    .insert(params)
    .select(TRACK_SELECT)
    .single()
    .returns<TrackRow>();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: toTrack(data), error: null };
}

export interface UpdateTrackParams {
  trackId: string;
  userId: string;
  title: string;
  description: string | null;
  image_urls: string[];
}

export async function updateTrack(
  supabase: SupabaseClient,
  params: UpdateTrackParams,
): Promise<{ data: Track | null; error: Error | null }> {
  const { trackId, userId, title, description, image_urls } = params;

  const { data, error } = await supabase
    .from('tracks')
    .update({
      title,
      description,
      image_urls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', trackId)
    .eq('user_id', userId)
    .select(TRACK_SELECT)
    .single()
    .returns<TrackRow>();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: toTrack(data), error: null };
}

export async function deleteTrack(trackId: string, userId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId)
    .eq('user_id', userId)
    .select('id')
    .returns<{ id: string }[]>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('삭제할 트랙을 찾을 수 없거나 삭제 권한이 없습니다.');
  }
}

export async function getTracksByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: Track[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('tracks')
    .select(TRACK_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<TrackRow[]>();

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: normalizeTrackRows(data), error: null };
}

type LikedTrackJoinRow = {
  tracks: TrackRow | TrackRow[] | null;
};

export async function getLikedTracksByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: Track[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('track_likes')
    .select(`tracks!inner(${TRACK_SELECT})`)
    .eq('user_id', userId)
    .returns<LikedTrackJoinRow[]>();

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const trackRows: TrackRow[] = [];
  for (const row of data ?? []) {
    const nested = row.tracks;
    if (Array.isArray(nested)) {
      trackRows.push(...nested);
    } else if (nested) {
      trackRows.push(nested);
    }
  }

  return { data: normalizeTrackRows(trackRows), error: null };
}

export async function getTrackCountByUserId(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('tracks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function upsertTrackLike(
  supabase: SupabaseClient,
  userId: string,
  trackId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('track_likes')
    .upsert({ user_id: userId, track_id: trackId }, { onConflict: 'user_id,track_id' });

  return { error: error ? new Error(error.message) : null };
}

export async function deleteTrackLike(
  supabase: SupabaseClient,
  userId: string,
  trackId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('track_likes')
    .delete()
    .eq('user_id', userId)
    .eq('track_id', trackId);

  return { error: error ? new Error(error.message) : null };
}

export async function getTrackLikeCount(
  supabase: SupabaseClient,
  trackId: string,
): Promise<{ count: number | null; error: Error | null }> {
  const { count, error } = await supabase
    .from('track_likes')
    .select('*', { count: 'exact', head: true })
    .eq('track_id', trackId);

  return { count: count ?? null, error: error ? new Error(error.message) : null };
}

export async function updateTrackLikesCount(
  supabase: SupabaseClient,
  trackId: string,
  likesCount: number,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('tracks')
    .update({ likes_count: likesCount })
    .eq('id', trackId);

  return { error: error ? new Error(error.message) : null };
}
