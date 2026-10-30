// 유저 비즈니스 로직
// Repository에서 가져온 유저 데이터를 화면에 맞게 조합/가공

import type { MypagePagePayload } from '@/commons/types/mypage';
import { createClient } from '@/lib/supabase/server';
import * as userRepository from '@/repositories/user.repository';
import * as courseService from '@/services/course/courseService';
import * as trackService from '@/services/track/trackService';

import { validateNickname } from './userValidation';

type MypageAuthFallback = {
  fallbackDisplayName: string;
};

/**
 * 마이페이지 진입 시 프로필·내 코스·좋아요 코스를 `Promise.all`로 병렬 패칭한다.
 * 닉네임은 `users` 우선, 없으면 `fallbackDisplayName`을 사용한다.
 */
export async function getMypagePageData(
  userId: string,
  authFallback: MypageAuthFallback,
): Promise<MypagePagePayload> {
  const supabase = createClient();

  const [profileResult, routeLists, trackLists] = await Promise.all([
    userRepository.getUserProfileById(supabase, userId),
    courseService.fetchMypageRouteLists(supabase, userId),
    trackService.fetchMypageTrackLists(supabase, userId),
  ]);

  if (profileResult.error) {
    console.error('[userService] 프로필 조회 실패:', profileResult.error);
  }

  const nickname = profileResult.data?.nickname?.trim() || authFallback.fallbackDisplayName;

  return {
    profile: {
      nickname,
      profile_image_url: profileResult.data?.profile_image_url ?? null,
    },
    myRoutes: routeLists.myRoutes,
    likedRoutes: routeLists.likedRoutes,
    myTracks: trackLists.myTracks,
    likedTracks: trackLists.likedTracks,
  };
}

/**
 * 게스트 작성 제한(코스·트랙 합산 1개)에 걸렸는지 확인한다.
 * 집계에 실패하면 우회를 막기 위해 제한에 걸린 것으로 본다. (실패 로그는 각 집계 함수가 남긴다)
 */
export async function isGuestWriteLimitReached(userId: string): Promise<boolean> {
  const [courseResult, trackResult] = await Promise.all([
    courseService.getUserRouteWriteCount(userId),
    trackService.getUserTrackWriteCount(userId),
  ]);

  if (courseResult.count === null || trackResult.count === null) return true;
  return courseResult.count + trackResult.count >= 1;
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const validation = validateNickname(nickname);

  if (!validation.isValid) {
    return false;
  }

  const isDuplicate = await userRepository.checkNicknameDuplicate(nickname);
  return !isDuplicate;
}

export async function changeNickname(userId: string, newNickname: string): Promise<void> {
  const validation = validateNickname(newNickname);

  if (!validation.isValid) {
    throw new Error(validation.message ?? '유효하지 않은 닉네임입니다.');
  }

  const isAvailable = await checkNicknameAvailable(newNickname);
  if (!isAvailable) {
    throw new Error('이미 사용 중인 닉네임입니다.');
  }

  await userRepository.updateNickname(userId, newNickname);
}
