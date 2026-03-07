/**
 * remote-index 공통 API 에러 코드 모음
 *
 * - 서버(Next API routes)와 클라이언트(훅/컴포넌트)에서 모두 import 가능하도록 "상수/타입"만 둡니다.
 * - 도메인별 세부 코드는 각 API/도메인 모듈에서 확장해도 됩니다.
 */

export const COMMON_API_ERROR_CODES = {
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  USAGE_LIMITED: 'USAGE_LIMITED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type CommonApiErrorCode = (typeof COMMON_API_ERROR_CODES)[keyof typeof COMMON_API_ERROR_CODES];

