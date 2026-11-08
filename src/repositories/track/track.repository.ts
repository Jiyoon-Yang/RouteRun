import type { Track } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/server';

import { TRACK_SELECT, toTrack, normalizeTrackRows, type TrackRow } from './track-row';

import type { SupabaseClient } from '@supabase/supabase-js';

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

/** 본인 트랙의 현재 `image_urls` (수정 시 빠진 이미지를 Storage에서 지우기 위해 조회) */
export async function getTrackImageUrls(
  supabase: SupabaseClient,
  trackId: string,
  userId: string,
): Promise<{ data: string[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('tracks')
    .select('image_urls')
    .eq('id', trackId)
    .eq('user_id', userId)
    .maybeSingle<{ image_urls: string[] | null }>();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data?.image_urls ?? [], error: null };
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

/** 본인 트랙를 삭제하고, 삭제된 행의 `image_urls`를 돌려준다 (Storage 정리용). */
export async function deleteTrack(trackId: string, userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId)
    .eq('user_id', userId)
    .select('id, image_urls')
    .returns<{ id: string; image_urls: string[] | null }[]>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('삭제할 트랙을 찾을 수 없거나 삭제 권한이 없습니다.');
  }

  return data[0].image_urls ?? [];
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

/**
 * `tracks.likes_count`를 조회한다. 이 값은 DB 트리거(`sync_track_likes_count`)가
 * `track_likes` insert/delete에 맞춰 자동으로 갱신하므로 여기서는 읽기만 한다.
 */
export async function getTrackLikesCount(
  supabase: SupabaseClient,
  trackId: string,
): Promise<{ count: number | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('tracks')
    .select('likes_count')
    .eq('id', trackId)
    .single();

  if (error) {
    return { count: null, error: new Error(error.message) };
  }

  return { count: data?.likes_count ?? 0, error: null };
}

/** sitemap용 전체 트랙 id와 마지막 수정 시각 (`updated_at`이 없으면 `created_at`). */
export async function getTrackSitemapEntries(): Promise<
  { id: string; lastModified: string | null }[]
> {
  const supabase = createClient();

  // shortcut: Supabase 기본 max-rows(1000)까지만 조회됨, 트랙이 1000개를 넘으면 range()로 페이지네이션
  const { data, error } = await supabase
    .from('tracks')
    .select('id, updated_at, created_at')
    .returns<{ id: string; updated_at: string | null; created_at: string | null }[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    lastModified: row.updated_at ?? row.created_at,
  }));
}
