/**
 * remote-index 클라이언트(API 호출)용 에러 파서
 * - 서버 에러 바디 구조가 바뀌어도, 여기만 고치면 UI/훅들은 그대로 유지
 *
 * 지원 형태 (우선순위)
 * 1) { success:false, error: { code: string, message: string } }  <-- (표준)
 * 2) { success:false, errorCode: string, error: string }          <-- (레거시)
 * 3) { error: { message: string } }                                <-- AuthError 표준(구형)
 * 4) { error: string }
 * 5) { message: string }
 */

export type ApiClientErrorInfo = {
  code?: string;
  message: string;
};

export class ApiClientError extends Error {
  code?: string;
  raw?: unknown;

  constructor(info: ApiClientErrorInfo, raw?: unknown) {
    super(info.message);
    this.name = 'ApiClientError';
    this.code = info.code;
    this.raw = raw;
  }
}

export function parseApiError(body: unknown): ApiClientErrorInfo | null {
  const b = body as any;

  // (표준) { success:false, error:{ code, message } }
  const errObj = b?.error;
  if (errObj && typeof errObj === 'object') {
    const code = (errObj as any)?.code;
    const message = (errObj as any)?.message;
    if (typeof message === 'string' && message.trim()) {
      return { code: typeof code === 'string' && code.trim() ? code : undefined, message };
    }
    // (AuthError 구형) { error:{ message } }
    if (typeof (errObj as any)?.message === 'string' && (errObj as any).message.trim()) {
      return { message: (errObj as any).message };
    }
  }

  // (레거시) { success:false, errorCode, error }
  const legacyCode = b?.errorCode;
  const legacyMessage = b?.error;
  if (typeof legacyCode === 'string' && legacyCode.trim() && typeof legacyMessage === 'string' && legacyMessage.trim()) {
    return { code: legacyCode, message: legacyMessage };
  }

  // { error: string }
  const err = b?.error;
  if (typeof err === 'string' && err.trim()) return { message: err };

  // { message: string }
  const msg = b?.message;
  if (typeof msg === 'string' && msg.trim()) return { message: msg };

  return null;
}

export function buildApiClientError(body: unknown, fallbackMessage: string, fallbackCode?: string): ApiClientError {
  const parsed = parseApiError(body);
  return new ApiClientError(
    parsed ?? { code: fallbackCode, message: fallbackMessage },
    body
  );
}

export function getApiErrorMessage(body: unknown, fallback: string): string {
  return parseApiError(body)?.message ?? fallback;
}

