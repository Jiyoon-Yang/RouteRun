'use client';

import { useState, useCallback } from 'react';

interface UseGoogleLoginOptions {
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
      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'google', returnTo }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        setIsError(true);
        return;
      }

      window.location.href = data.url;
    } catch {
      setIsError(true);
    } finally {
      setIsPending(false);
    }
  }, [returnTo]);

  return { trigger, isPending, isError };
}
