'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// ─── 스토리지 키 ────────────────────────────────────────────────────────────────

const STORAGE_KEY_ACCESS = 'accesstoken';
const STORAGE_KEY_REFRESH = 'refreshtoken';

// ─── 토큰 저장소 유틸 ───────────────────────────────────────────────────────────

function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(STORAGE_KEY_ACCESS, accessToken);
  localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);
}

function loadAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACCESS);
}

function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY_ACCESS);
  localStorage.removeItem(STORAGE_KEY_REFRESH);
}

// ─── JWT 디코딩 유틸 ────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractIsAnonymous(token: string): boolean {
  const payload = decodeJwtPayload(token);
  return payload?.is_anonymous === true;
}

// ─── 타입 ──────────────────────────────────────────────────────────────────────

export interface AuthLoginOptions {
  accessToken: string;
  refreshToken: string;
}

export interface AuthLogoutOptions {
  callApi?: boolean;
}

interface AuthState {
  accessToken: string | null;
  isLoggedIn: boolean;
  isAnonymous: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (options: AuthLoginOptions) => void;
  logout: (options?: AuthLogoutOptions) => void;
  getAccessToken: () => string | null;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    isLoggedIn: false,
    isAnonymous: false,
  });

  // 초기 복원: 앱 시작 시 저장된 토큰으로 인증 상태 복원
  useEffect(() => {
    const stored = loadAccessToken();
    if (!stored) return;

    setAuthState({
      accessToken: stored,
      isLoggedIn: true,
      isAnonymous: extractIsAnonymous(stored),
    });
  }, []);

  const login = useCallback(({ accessToken, refreshToken }: AuthLoginOptions) => {
    saveTokens(accessToken, refreshToken);
    setAuthState({
      accessToken,
      isLoggedIn: true,
      isAnonymous: extractIsAnonymous(accessToken),
    });
  }, []);

  const logout = useCallback((_options?: AuthLogoutOptions) => {
    clearTokens();
    setAuthState({
      accessToken: null,
      isLoggedIn: false,
      isAnonymous: false,
    });
  }, []);

  const getAccessToken = useCallback(() => authState.accessToken, [authState.accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      login,
      logout,
      getAccessToken,
    }),
    [authState, login, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
