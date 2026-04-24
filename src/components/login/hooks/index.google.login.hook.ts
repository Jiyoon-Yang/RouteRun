'use client';

import { useCallback, useState } from 'react';

import { signInWithGoogle } from '@/actions/auth.action';

interface UseGoogleLoginOptions {
  /** 기본값 `/` — 로그인 페이지에서는 pathname을 쓰면 `/login`으로 고정되는 문제가 있어 명시적으로 넘긴다. */
  returnTo?: string;
}

interface UseGoogleLoginResult {
  trigger: () => Promise<void>;
  isPending: boolean;
  isError: boolean;
}

export function useGoogleLogin({
  returnTo = '/',
}: UseGoogleLoginOptions = {}): UseGoogleLoginResult {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);

  const trigger = useCallback(async () => {
    setIsPending(true);
    setIsError(false);

    try {
      const result = await signInWithGoogle(returnTo);

      // 성공 시 redirect()가 발생하므로 이 블록은 실행되지 않음
      if (result?.error) {
        setIsError(true);
        setIsPending(false);
      }
    } catch {
      setIsError(true);
      setIsPending(false);
    }
  }, [returnTo]);

  return { trigger, isPending, isError };
}
