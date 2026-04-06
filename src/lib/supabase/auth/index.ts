import { User } from "@supabase/supabase-js";
import { createSupabaseClientWithToken } from "@/lib/supabase/initialize";

// ─── 공통 에러 타입 ────────────────────────────────────────────────────────────

export type AuthErrorCode = "UNAUTHENTICATED";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

// ─── 내부 유틸 ─────────────────────────────────────────────────────────────────

function extractBearerToken(headers: Headers): string {
  const authorization = headers.get("Authorization");

  if (!authorization) {
    throw new AuthError("UNAUTHENTICATED", "Authorization 헤더가 누락되었습니다.");
  }

  const [scheme, token] = authorization.split(" ");

  if (!token || scheme.toLowerCase() !== "bearer") {
    throw new AuthError("UNAUTHENTICATED", "Authorization 헤더 형식이 올바르지 않습니다.");
  }

  return token;
}

async function fetchUserByToken(token: string): Promise<User> {
  const client = createSupabaseClientWithToken(token);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new AuthError("UNAUTHENTICATED", "유효하지 않은 토큰입니다.");
  }

  return data.user;
}

// ─── 공개 API ──────────────────────────────────────────────────────────────────

/**
 * 기본형: 헤더에서 토큰을 추출하고 사용자 식별값(userId)을 반환한다.
 */
export async function authorizeUserId(headers: Headers): Promise<string> {
  const token = extractBearerToken(headers);
  const user = await fetchUserByToken(token);
  return user.id;
}

/**
 * 확장형: 헤더에서 토큰을 추출하고 사용자 전체 정보를 반환한다.
 */
export async function authorizeUser(headers: Headers): Promise<User> {
  const token = extractBearerToken(headers);
  return fetchUserByToken(token);
}

/**
 * 토큰전용형: 토큰 문자열을 직접 받아 유효성을 검증하고 사용자 식별값(userId)을 반환한다.
 */
export async function verifyToken(token: string): Promise<string> {
  const user = await fetchUserByToken(token);
  return user.id;
}
