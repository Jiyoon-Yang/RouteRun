import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseClient } from '@/lib/supabase/initialize';

type OAuthProvider = 'google';

const PROVIDER_MAP: Record<string, OAuthProvider> = {
  google: 'google',
};

const DEFAULT_PROVIDER: OAuthProvider = 'google';

function isRelativePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

function getProjectRef(): string {
  const url = process.env.SUPABASE_URL ?? '';
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? '';
}

function buildBridgePage({
  accessToken,
  refreshToken,
  returnTo,
  projectRef,
}: {
  accessToken: string;
  refreshToken: string;
  returnTo: string;
  projectRef: string;
}): string {
  const safeReturnTo = isRelativePath(returnTo) ? returnTo : '/';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>인증 처리 중...</title>
</head>
<body>
<script>
(function () {
  var accessToken = ${JSON.stringify(accessToken)};
  var refreshToken = ${JSON.stringify(refreshToken)};
  var returnTo = ${JSON.stringify(safeReturnTo)};
  var projectRef = ${JSON.stringify(projectRef)};

  var hash = window.location.hash.replace(/^#/, "");
  if (hash) {
    var params = new URLSearchParams(hash);
    var hashAccess = params.get("access_token");
    var hashRefresh = params.get("refresh_token");
    if (hashAccess && hashRefresh) {
      accessToken = hashAccess;
      refreshToken = hashRefresh;
    }
  }

  if (!accessToken || !refreshToken) {
    window.location.replace("/login?error=token_missing");
    return;
  }

  var storageKey = "sb-" + projectRef + "-auth-token";
  var session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(session));
  } catch (_) {}

  window.location.replace(returnTo);
})();
</script>
<p>인증 처리 중입니다...</p>
</body>
</html>`;
}

// POST: 공급자 로그인 시작 URL 발급
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';
    const returnTo = isRelativePath(body.returnTo) ? body.returnTo : '/';

    const provider = PROVIDER_MAP[action] ?? DEFAULT_PROVIDER;
    const origin = request.nextUrl.origin;
    const callbackUrl = `${origin}/api/auth/google-login?returnTo=${encodeURIComponent(returnTo)}`;

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return NextResponse.json({ error: error?.message ?? 'URL 발급 실패' }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// GET: OAuth callback(code) 처리 + hash 기반 토큰 처리 브릿지
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const rawReturnTo = searchParams.get('returnTo');
  const returnTo = isRelativePath(rawReturnTo) ? rawReturnTo : '/';
  const projectRef = getProjectRef();

  // hash 기반 토큰 전달 케이스: code 없이 브릿지 페이지 반환
  if (!code) {
    const bridgePage = buildBridgePage({
      accessToken: '',
      refreshToken: '',
      returnTo,
      projectRef,
    });
    return new NextResponse(bridgePage, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session?.access_token || !data.session?.refresh_token) {
    return NextResponse.redirect(new URL('/login?error=token_missing', request.nextUrl.origin));
  }

  const { access_token, refresh_token } = data.session;
  const bridgePage = buildBridgePage({
    accessToken: access_token,
    refreshToken: refresh_token,
    returnTo,
    projectRef,
  });

  return new NextResponse(bridgePage, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
