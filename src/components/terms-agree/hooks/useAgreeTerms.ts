'use client';

import { useCallback, useState } from 'react';

import { agreeToTermsAction } from '@/actions/auth.action';

export function useAgreeTerms(returnTo: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agree = useCallback(async () => {
    setIsPending(true);
    setError(null);
    try {
      const result = await agreeToTermsAction(returnTo);
      // 성공 시 redirect로 화면이 바뀐다 — 여기는 실패 때만 온다
      if (result?.error) {
        setError(result.error);
        setIsPending(false);
      }
    } catch (err) {
      console.error('[useAgreeTerms] 동의 저장 중 예외:', err);
      setError('네트워크 오류가 발생했습니다.');
      setIsPending(false);
    }
  }, [returnTo]);

  return { agree, isPending, error };
}
