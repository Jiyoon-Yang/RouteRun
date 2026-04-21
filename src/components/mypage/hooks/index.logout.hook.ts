'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/commons/providers/auth/auth.provider';

interface UseLogoutResult {
  trigger: () => Promise<void>;
  isPending: boolean;
  isError: boolean;
}

export function useLogout(): UseLogoutResult {
  const { getAccessToken, logout } = useAuth();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);

  const trigger = useCallback(async () => {
    setIsPending(true);
    setIsError(false);

    const accessToken = getAccessToken();

    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch {
      // 서버 로그아웃 실패해도 클라이언트 상태는 초기화 (멱등성)
    } finally {
      logout();
      // router.replace('/login');
      setIsPending(false);
    }
  }, [getAccessToken, logout, router]);

  return { trigger, isPending, isError };
}
