'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@/commons/constants/url';
import { useAuth } from '@/commons/providers/auth/auth.provider';
import { useModal } from '@/commons/providers/modal/modal.provider';
import { useToast } from '@/commons/providers/toast/toast.provider';

type LikeCountsById = Record<string, number>;

export type LikeConfig = {
  entityLabel: string;
  fetchLikedIds: (userId: string, ids: string[]) => Promise<{ data: Set<string>; error: unknown }>;
  toggleAction: (
    id: string,
    shouldLike: boolean,
    invalidate: boolean,
  ) => Promise<{ error?: unknown; likeCount?: number | null }>;
};

function clampLikeCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

export function useLikes(initialLikeCounts: LikeCountsById, config: LikeConfig) {
  const { entityLabel } = config;
  const fetchRef = useRef(config.fetchLikedIds);
  const toggleRef = useRef(config.toggleAction);
  fetchRef.current = config.fetchLikedIds;
  toggleRef.current = config.toggleAction;

  const { user, isLoggedIn, isLoading } = useAuth();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [optimisticLikeCounts, setOptimisticLikeCounts] = useState<LikeCountsById>({});

  const ids = useMemo(() => Object.keys(initialLikeCounts), [initialLikeCounts]);
  const idsKey = useMemo(() => ids.join('|'), [ids]);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn || !user) {
      setLikedIds(new Set());
      return;
    }

    let isMounted = true;
    const sync = async () => {
      const result = await fetchRef.current(user.id, ids);
      if (!isMounted) return;
      if (result.error) {
        console.error(`[useLikes:${entityLabel}] 좋아요 상태 조회 실패:`, result.error);
        return;
      }
      setLikedIds(result.data);
    };
    sync();
    return () => {
      isMounted = false;
    };
  }, [entityLabel, ids, idsKey, isLoading, isLoggedIn, user]);

  const openLoginConfirm = useCallback(() => {
    openModal({
      type: 'confirm',
      title: '좋아요는 로그인이 필요합니다. 로그인하시겠어요?',
      confirmText: '네',
      cancelText: '아니오',
      onConfirm: () => {
        router.push(`${ROUTES.LOGIN}?next=${encodeURIComponent(pathname || '/')}`);
      },
    });
  }, [entityLabel, openModal, pathname, router]);

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);

  const getLikeCount = useCallback(
    (id: string) => {
      const count = optimisticLikeCounts[id] ?? clampLikeCount(initialLikeCounts[id] ?? 0);
      return likedIds.has(id) ? Math.max(1, count) : count;
    },
    [initialLikeCounts, likedIds, optimisticLikeCounts],
  );

  const toggleLike = useCallback(
    async (id: string) => {
      if (isLoading) return;
      if (!isLoggedIn || !user) {
        openLoginConfirm();
        return;
      }

      const wasLiked = likedIds.has(id);
      const shouldLike = !wasLiked;
      const previousCount = getLikeCount(id);
      const nextCount = clampLikeCount(previousCount + (shouldLike ? 1 : -1));

      setLikedIds((previous) => {
        const next = new Set(previous);
        if (shouldLike) next.add(id);
        else next.delete(id);
        return next;
      });
      setOptimisticLikeCounts((previous) => ({ ...previous, [id]: nextCount }));

      const result = await toggleRef.current(id, shouldLike, pathname !== '/mypage');
      if (!result.error) {
        if (typeof result.likeCount === 'number') {
          setOptimisticLikeCounts((previous) => ({
            ...previous,
            [id]: result.likeCount ?? nextCount,
          }));
        }
        return;
      }

      console.error(`[useLikes:${entityLabel}] 좋아요 상태 변경 실패:`, result.error);
      showToast('좋아요 처리에 실패했습니다.', 'failed');
      setLikedIds((previous) => {
        const next = new Set(previous);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      setOptimisticLikeCounts((previous) => ({ ...previous, [id]: previousCount }));
    },
    [
      entityLabel,
      getLikeCount,
      isLoading,
      isLoggedIn,
      likedIds,
      openLoginConfirm,
      pathname,
      showToast,
      user,
    ],
  );

  return { isLiked, getLikeCount, toggleLike };
}
