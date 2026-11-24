import { describe, expect, it } from 'vitest';

import { shouldRedirectToAgree } from './terms-consent';

const agreed = { user_metadata: { terms_agreed_at: '2026-11-24T00:00:00.000Z' } };
const notAgreed = { user_metadata: { full_name: '러너' } };

describe('shouldRedirectToAgree', () => {
  it('로그인했고 미동의면 페이지 요청을 동의 화면으로 보낸다', () => {
    expect(shouldRedirectToAgree(notAgreed, '/home', 'GET')).toBe(true);
    expect(shouldRedirectToAgree({}, '/mypage', 'GET')).toBe(true);
  });

  it('동의한 사용자와 비로그인은 보내지 않는다', () => {
    expect(shouldRedirectToAgree(agreed, '/home', 'GET')).toBe(false);
    expect(shouldRedirectToAgree(null, '/home', 'GET')).toBe(false);
  });

  it('동의 화면·약관·로그인·OAuth 콜백은 동의 전에도 열린다', () => {
    for (const path of ['/agree', '/terms', '/privacy', '/login', '/auth/callback']) {
      expect(shouldRedirectToAgree(notAgreed, path, 'GET')).toBe(false);
    }
  });

  it('Server Action(POST)은 막지 않는다', () => {
    expect(shouldRedirectToAgree(notAgreed, '/agree', 'POST')).toBe(false);
    expect(shouldRedirectToAgree(notAgreed, '/home', 'POST')).toBe(false);
  });
});
