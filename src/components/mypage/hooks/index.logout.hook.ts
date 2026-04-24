'use client';

import { useCallback, useState } from 'react';

import { signOut } from '@/actions/auth.action';

interface UseLogoutResult {
  trigger: () => Promise<void>;
  isPending: boolean;
  isError: boolean;
}

export function useLogout(): UseLogoutResult {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);

  const trigger = useCallback(async () => {
    setIsPending(true);
    setIsError(false);

    try {
      await signOut();
      // 성공 시 redirect('/login')이 발생하여 컴포넌트 언마운트
    } catch {
      setIsError(true);
      setIsPending(false);
    }
  }, []);

  return { trigger, isPending, isError };
}
