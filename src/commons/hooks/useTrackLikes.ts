'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { toggleTrackLikeAction } from '@/actions/track.action';
import { ROUTES } from '@/commons/constants/url';
import { useAuth } from '@/commons/providers/auth/auth.provider';
import { useModal } from '@/commons/providers/modal/modal.provider';
import { useToast } from '@/commons/providers/toast/toast.provider';
import { fetchLikedTrackIds } from '@/services/track/trackLikeService';

type LikeCountsByTrackId = Record<string, number>;

function clampLikeCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

export function useTrackLikes(initialLikeCounts: LikeCountsByTrackId) {
  const { user, isLoggedIn, isLoading } = useAuth();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [optimisticLikeCounts, setOptimisticLikeCounts] = useState<LikeCountsByTrackId>({});

  const trackIds = useMemo(() => Object.keys(initialLikeCounts), [initialLikeCounts]);
  const trackIdsKey = useMemo(() => trackIds.join('|'), [trackIds]);
  const canUseTrackLike = isLoggedIn;

  useEffect(() => {
    if (isLoading) return;
    if (!canUseTrackLike || !user) {
      setLikedTrackIds(new Set());
      return;
    }

    let isMounted = true;

    const syncLikedTracks = async () => {
      const result = await fetchLikedTrackIds(user.id, trackIds);
      if (!isMounted) return;
      if (result.error) {
        console.error('[useTrackLikes] 찜 상태 조회 실패:', result.error);
        return;
      }
      setLikedTrackIds(result.data);
    };

    syncLikedTracks();

    return () => {
      isMounted = false;
    };
  }, [canUseTrackLike, trackIds, trackIdsKey, isLoading, user]);

  const openGoogleLoginConfirm = useCallback(() => {
    openModal({
      type: 'confirm',
      title: "'트랙 좋아요'는 로그인한 유저만 이용가능합니다. 로그인 하시겠습니까?",
      confirmText: '네',
      cancelText: '아니오',
      onConfirm: () => {
        router.push(`${ROUTES.LOGIN}?next=${encodeURIComponent(pathname || '/')}`);
      },
    });
  }, [openModal, pathname, router]);

  const isTrackLiked = useCallback(
    (trackId: string) => likedTrackIds.has(trackId),
    [likedTrackIds],
  );

  const getTrackLikeCount = useCallback(
    (trackId: string) => {
      const count =
        optimisticLikeCounts[trackId] ?? clampLikeCount(initialLikeCounts[trackId] ?? 0);
      return likedTrackIds.has(trackId) ? Math.max(1, count) : count;
    },
    [initialLikeCounts, likedTrackIds, optimisticLikeCounts],
  );

  const toggleTrackLike = useCallback(
    async (trackId: string) => {
      if (isLoading) return;
      if (!canUseTrackLike || !user) {
        openGoogleLoginConfirm();
        return;
      }

      const wasLiked = likedTrackIds.has(trackId);
      const shouldLike = !wasLiked;
      const previousCount = getTrackLikeCount(trackId);
      const nextCount = clampLikeCount(previousCount + (shouldLike ? 1 : -1));

      setLikedTrackIds((previous) => {
        const next = new Set(previous);
        if (shouldLike) {
          next.add(trackId);
        } else {
          next.delete(trackId);
        }
        return next;
      });
      setOptimisticLikeCounts((previous) => ({ ...previous, [trackId]: nextCount }));

      const result = await toggleTrackLikeAction(trackId, shouldLike, pathname !== '/mypage');
      if (!result.error) {
        if (typeof result.likeCount === 'number') {
          setOptimisticLikeCounts((previous) => ({
            ...previous,
            [trackId]: result.likeCount ?? nextCount,
          }));
        }
        return;
      }

      console.error('[useTrackLikes] 찜 상태 변경 실패:', result.error);
      showToast('좋아요 처리에 실패했습니다.', 'failed');
      setLikedTrackIds((previous) => {
        const next = new Set(previous);
        if (wasLiked) {
          next.add(trackId);
        } else {
          next.delete(trackId);
        }
        return next;
      });
      setOptimisticLikeCounts((previous) => ({ ...previous, [trackId]: previousCount }));
    },
    [
      canUseTrackLike,
      getTrackLikeCount,
      isLoading,
      likedTrackIds,
      openGoogleLoginConfirm,
      pathname,
      showToast,
      user,
    ],
  );

  return { isTrackLiked, getTrackLikeCount, toggleTrackLike };
}
