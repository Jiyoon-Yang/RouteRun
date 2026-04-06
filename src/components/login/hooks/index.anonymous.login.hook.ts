'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseAnonymousLoginOptions {
  returnTo?: string;
}

interface UseAnonymousLoginResult {
  trigger: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useAnonymousLogin({ returnTo }: UseAnonymousLoginOptions = {}): UseAnonymousLoginResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const trigger = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/anonymous-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo }),
      });

      const data = await response.json();

      if (!response.ok || !data.access_token || !data.refresh_token) {
        setError(data.error ?? '익명 로그인에 실패했습니다.');
        return;
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      router.push(data.returnTo ?? returnTo ?? '/');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [returnTo, router]);

  return { trigger, isLoading, error };
}
