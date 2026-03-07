import type { NextApiResponse } from 'next';
import type { AuthErrorCode } from '@dobby/core-utils/src/utils/auth/index';
import { isAuthError } from '@dobby/core-utils/src/utils/auth/index';
import { COMMON_API_ERROR_CODES } from '@/commons/libraries/api-error-codes';

/**
 * remote-index 전용 "초간단" 공통 에러 처리 모듈
 * - 딱 2개만 지원: 인가, 사용제한(쿼터)
 * - 확장성/범용성 고려하지 않음 (요구사항 기준)
 */

export type RemoteIndexErrorCode = AuthErrorCode | 'USAGE_LIMITED';

export type RemoteIndexErrorBody = {
  success: false;
  errorCode: RemoteIndexErrorCode;
  error: string;
};

/**
 * (신규) 클라이언트 표준 에러 형태
 * - 여러 API들에서 사용 중인 형태: { success: false, error: { code, message } }
 * - 도메인 전용 코드(ex: DNA_INSUFFICIENT)는 각 API에서 결정하고,
 *   이 모듈은 "응답 포맷"만 공통으로 제공한다.
 */
export type ApiErrorObject<TCode extends string = string> = {
  code: TCode;
  message: string;
};

export type ApiErrorResponse<TCode extends string = string> = {
  success: false;
  error: ApiErrorObject<TCode>;
};

export function buildApiError<TCode extends string>(code: TCode, message: string): ApiErrorObject<TCode> {
  return { code, message };
}

export function buildApiErrorResponse<TCode extends string>(code: TCode, message: string): ApiErrorResponse<TCode> {
  return { success: false, error: buildApiError(code, message) };
}

export function respondApiError<TCode extends string>(
  res: NextApiResponse<ApiErrorResponse<TCode>>,
  status: number,
  code: TCode,
  message: string
) {
  return res.status(status).json(buildApiErrorResponse(code, message));
}

/**
 * 자주 쓰는 표준 응답 헬퍼들
 * - API 라우트에서 임의 shape로 json을 만들지 말고, 되도록 이 헬퍼를 사용해 응답 shape를 통일합니다.
 */
export function respondMethodNotAllowed(res: NextApiResponse<any>, allowed: string, message?: string) {
  return respondApiError(
    res,
    405,
    COMMON_API_ERROR_CODES.METHOD_NOT_ALLOWED,
    message ?? `Method Not Allowed. Only ${allowed.toUpperCase()} is allowed.`
  );
}

export function respondInvalidRequest(res: NextApiResponse<any>, message = '요청 형식이 올바르지 않습니다.') {
  return respondApiError(res, 400, COMMON_API_ERROR_CODES.INVALID_REQUEST, message);
}

export function respondInternalError(res: NextApiResponse<any>, message = '서버 오류가 발생했습니다.') {
  return respondApiError(res, 500, COMMON_API_ERROR_CODES.INTERNAL_SERVER_ERROR, message);
}

export function buildError<TBase extends Record<string, unknown>>(
  base: TBase,
  errorCode: RemoteIndexErrorCode,
  error: string
): TBase & RemoteIndexErrorBody {
  return {
    ...(base as TBase),
    success: false,
    errorCode,
    error,
  };
}

export function respondUnauthenticated<T>(res: NextApiResponse<T>, body: T) {
  return res.status(401).json(body);
}

export function respondUsageLimited<T>(res: NextApiResponse<T>, body: T) {
  return res.status(403).json(body);
}

/**
 * 공통 인가 에러(AuthError)를 remote-index 응답으로 변환합니다.
 * - 메시지 비교 금지: error.code 기반으로만 처리합니다.
 * - 성공 시 true 반환(응답 종료), 아니면 false 반환
 */
export function tryRespondAuthError<T>(
  res: NextApiResponse<T>,
  error: unknown,
  buildBody: (code: AuthErrorCode, message: string) => T
): boolean {
  if (!isAuthError(error)) return false;
  respondUnauthenticated(res, buildBody(error.code, error.message));
  return true;
}

