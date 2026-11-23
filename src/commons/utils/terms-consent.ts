import { ROUTES } from '@/commons/constants/url';

/** 약관 동의 시각을 담는 Supabase user_metadata 키 */
export const TERMS_AGREED_AT_KEY = 'terms_agreed_at';

// 동의 전에도 열려야 하는 경로: 동의 화면, 읽어야 할 문서, 로그인·OAuth 콜백
const CONSENT_EXEMPT_PATHS: readonly string[] = [
  ROUTES.AGREE,
  ROUTES.TERMS,
  ROUTES.PRIVACY,
  ROUTES.LOGIN,
];

type MaybeUser = { user_metadata?: Record<string, unknown> } | null;

export function hasAgreedToTerms(user: MaybeUser): boolean {
  return typeof user?.user_metadata?.[TERMS_AGREED_AT_KEY] === 'string';
}

/** 로그인했지만 약관에 동의하지 않은 사용자의 페이지 요청(GET)이면 true */
export function shouldRedirectToAgree(user: MaybeUser, pathname: string, method: string): boolean {
  // 페이지 이동만 막는 UI 게이팅이다. Server Action(POST)까지 돌리면 응답이 깨지고, 동의 기록은 user_metadata로 남는다
  if (!user || method !== 'GET') return false;
  if (CONSENT_EXEMPT_PATHS.includes(pathname) || pathname.startsWith('/auth/')) return false;
  return !hasAgreedToTerms(user);
}
