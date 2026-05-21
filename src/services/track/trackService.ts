import type { MypageTrackCardData } from '@/commons/types/mypage';
import type { Track } from '@/commons/types/routerun';
import * as trackRepository from '@/repositories/track/track.repository';
import type { InsertTrackParams, UpdateTrackParams } from '@/repositories/track/track.repository';

import type { SupabaseClient } from '@supabase/supabase-js';

export type SubmitTrackInput = {
  title: string;
  description?: string | null;
  trackPoint: { lat: number; lng: number };
  distanceMeters: number;
  imageUrls: string[];
};

export async function submitNewTrack(
  supabase: SupabaseClient,
  input: SubmitTrackInput,
  userId: string,
  startAddressRegion?: string | null,
): Promise<{ data: Track | null; error: Error | null }> {
  const payload: InsertTrackParams = {
    user_id: userId,
    title: input.title,
    description: input.description ?? null,
    distance_meters: input.distanceMeters,
    start_lat: input.trackPoint.lat,
    start_lng: input.trackPoint.lng,
    start_address_region: startAddressRegion ?? null,
    image_urls: input.imageUrls,
  };

  return trackRepository.createTrack(supabase, payload);
}

export async function deleteTrack(trackId: string, userId: string): Promise<void> {
  await trackRepository.deleteTrack(trackId, userId);
}

export async function updateTrack(
  supabase: SupabaseClient,
  data: Omit<UpdateTrackParams, 'userId'>,
  userId: string,
): Promise<{ data: Track | null; error: Error | null }> {
  return trackRepository.updateTrack(supabase, { ...data, userId });
}

export async function getUserTrackWriteCount(userId: string): Promise<{
  count: number | null;
  error: Error | null;
}> {
  try {
    const count = await trackRepository.getTrackCountByUserId(userId);
    return { count, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[trackService] 유저 트랙 작성 횟수 조회 실패:', error);
    return { count: null, error };
  }
}

function trackToMypageCard(track: Track): MypageTrackCardData {
  return {
    id: track.id,
    title: track.title,
    start_address_region: track.start_address_region ?? null,
    distanceText: `${track.distance_meters}m`,
    likeCount: track.likes_count,
    thumbnailUrl: track.image_urls[0],
    createdAt: track.created_at,
  };
}

export async function fetchMypageTrackLists(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ myTracks: MypageTrackCardData[]; likedTracks: MypageTrackCardData[] }> {
  const [myResult, likedResult] = await Promise.all([
    trackRepository.getTracksByUserId(supabase, userId),
    trackRepository.getLikedTracksByUserId(supabase, userId),
  ]);

  if (myResult.error) {
    console.error('[trackService] 내 트랙 목록 조회 실패:', myResult.error);
  }

  if (likedResult.error) {
    console.error('[trackService] 좋아요한 트랙 목록 조회 실패:', likedResult.error);
  }

  return {
    myTracks: myResult.data.map(trackToMypageCard),
    likedTracks: likedResult.data.map(trackToMypageCard),
  };
}
