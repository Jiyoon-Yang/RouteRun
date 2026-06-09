'use client';

import { useCallback, type KeyboardEvent } from 'react';

/** 카드 래퍼에서 Enter·Space로 선택 — 자식으로 버블된 이벤트는 무시(target 일치 시만 처리) */
export function useItemCardKeyboardSelect() {
  return useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.currentTarget.click();
    }
  }, []);
}
