'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { SIGNUP_COOKIE } from '@/commons/constants/analytics';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const SIGNUP_PATTERN = new RegExp(`(?:^|; )${SIGNUP_COOKIE}=(google|guest)`);

/**
 * 서버가 가입 직후 남긴 쿠키를 GA `sign_up` 이벤트로 보내고 지운다.
 * 게스트 가입은 서버 액션 redirect(소프트 이동)라 첫 로드만이 아니라 경로가 바뀔 때마다 확인한다.
 * GA 초기화 `<Script>` 뒤에 둬야 이 effect가 돌 때 `gtag`가 정의돼 있다.
 */
export function GaSignupEvent() {
  const pathname = usePathname();

  useEffect(() => {
    const method = document.cookie.match(SIGNUP_PATTERN)?.[1];
    // gtag가 아직 없으면 쿠키를 남겨 다음 경로 변경 때 다시 시도한다
    if (!method || !window.gtag) return;

    document.cookie = `${SIGNUP_COOKIE}=; Max-Age=0; path=/`;
    window.gtag('event', 'sign_up', { method });
  }, [pathname]);

  return null;
}
