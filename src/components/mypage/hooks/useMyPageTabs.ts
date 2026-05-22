'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import type { MypageTab } from '@/commons/types/mypage';

const TAB_VALUES: MypageTab[] = ['my-posts', 'liked-posts'];

export function useMyPageTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: MypageTab = TAB_VALUES.includes(rawTab as MypageTab)
    ? (rawTab as MypageTab)
    : 'my-posts';

  const setTab = useCallback(
    (tab: MypageTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`/mypage?${params.toString()}`);
    },
    [router, searchParams],
  );

  return { activeTab, setTab };
}
