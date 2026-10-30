'use server';

import { revalidatePath } from 'next/cache';

import type { Track } from '@/commons/types/routerun';
import { validatePostInput } from '@/commons/utils/post-input';
import { isValidUuid } from '@/commons/utils/uuid';
import { createClient } from '@/lib/supabase/server';
import * as trackRepository from '@/repositories/track/track.repository';
import * as trackService from '@/services/track/trackService';
import type { SubmitTrackInput } from '@/services/track/trackService';
import { isGuestWriteLimitReached } from '@/services/user/userService';

export type CreateTrackActionResult =
  | { success: true; trackId: string }
  | { success: false; message: string };

type DeleteTrackActionResult = { success: true } | { success: false; error: string };

export type UpdateTrackActionInput = {
  trackId: string;
  title: string;
  description: string | null;
  image_urls: string[];
};

export type UpdateTrackActionResult =
  | { success: true; data: Track }
  | { success: false; error: string };

export type ToggleTrackLikeActionResult = { likeCount: number | null; error: string | null };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function toggleTrackLikeAction(
  trackId: string,
  shouldLike: boolean,
  revalidateMypage = true,
): Promise<ToggleTrackLikeActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { likeCount: null, error: '로그인이 필요합니다.' };
  }

  if (shouldLike) {
    const { error } = await trackRepository.upsertTrackLike(supabase, user.id, trackId);
    if (error) return { likeCount: null, error: error.message };
  } else {
    const { error } = await trackRepository.deleteTrackLike(supabase, user.id, trackId);
    if (error) return { likeCount: null, error: error.message };
  }

  // likes_count는 DB 트리거(sync_track_likes_count)가 자동으로 갱신하므로 결과만 읽어온다.
  const { count, error: countError } = await trackRepository.getTrackLikesCount(supabase, trackId);
  if (countError) return { likeCount: null, error: countError.message };

  const nextLikeCount = count ?? 0;

  revalidatePath(`/tracks/${trackId}`);
  if (revalidateMypage) {
    revalidatePath('/mypage');
  }

  return { likeCount: nextLikeCount, error: null };
}

export async function createTrackAction(input: SubmitTrackInput): Promise<CreateTrackActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: '로그인이 필요합니다.' };
  }

  if (user.is_anonymous === true && (await isGuestWriteLimitReached(user.id))) {
    return { success: false, message: '게스트는 코스·트랙을 합산 1개까지만 등록할 수 있습니다.' };
  }

  const validated = validatePostInput(input);
  if (validated.error !== null) {
    return { success: false, message: validated.error };
  }

  const start_lat = input.trackPoint?.lat;
  const start_lng = input.trackPoint?.lng;

  if (!isFiniteNumber(start_lat) || !isFiniteNumber(start_lng)) {
    return { success: false, message: '지도에서 트랙 위치를 지정해 주세요.' };
  }

  if (!isFiniteNumber(input.distanceMeters) || input.distanceMeters <= 0) {
    return { success: false, message: '트랙 거리를 입력해 주세요.' };
  }

  const { data, error } = await trackService.submitNewTrack(
    supabase,
    { ...input, ...validated.data },
    user.id,
    input.addressRegion ?? null,
  );

  if (error || !data) {
    return { success: false, message: error?.message ?? '트랙 등록에 실패했습니다.' };
  }

  revalidatePath('/');
  revalidatePath('/tracks');
  return { success: true, trackId: data.id };
}

export async function deleteTrackAction(trackId: string): Promise<DeleteTrackActionResult> {
  try {
    if (!trackId.trim()) {
      return { success: false, error: '유효하지 않은 트랙 ID입니다.' };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '인증되지 않은 사용자입니다.' };
    }

    await trackService.deleteTrack(trackId, user.id);

    revalidatePath('/mypage');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('[deleteTrackAction] 트랙 삭제 실패:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '트랙 삭제 중 알 수 없는 오류가 발생했습니다.',
    };
  }
}

export async function updateTrackAction(
  input: UpdateTrackActionInput,
): Promise<UpdateTrackActionResult> {
  const { trackId, title, description, image_urls } = input;

  if (!trackId?.trim() || !isValidUuid(trackId)) {
    return { success: false, error: '유효하지 않은 트랙 ID입니다.' };
  }

  const validated = validatePostInput({ title, description, imageUrls: image_urls });
  if (validated.error !== null) {
    return { success: false, error: validated.error };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const id = trackId.trim();

  const { data, error } = await trackService.updateTrack(
    supabase,
    {
      trackId: id,
      title: validated.data.title,
      description: validated.data.description,
      image_urls: validated.data.imageUrls,
    },
    user.id,
  );

  if (error || !data) {
    return { success: false, error: error?.message ?? '트랙 수정에 실패했습니다.' };
  }

  revalidatePath(`/tracks/${id}`);
  revalidatePath('/tracks');

  return { success: true, data };
}
