import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseClientWithToken } from '@/lib/supabase/initialize';

function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) return null;

  return parts[1];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const accessToken = extractBearerToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: '잘못된 요청: Authorization Bearer 토큰이 누락되었거나 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseClientWithToken(accessToken);
    await supabase.auth.signOut();
  } catch {
    // Supabase 로그아웃 실패해도 클라이언트 로그아웃 흐름은 유지 (멱등성)
  }

  return NextResponse.json({ success: true });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: '허용되지 않는 메서드입니다.' }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: '허용되지 않는 메서드입니다.' }, { status: 405 });
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json({ error: '허용되지 않는 메서드입니다.' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: '허용되지 않는 메서드입니다.' }, { status: 405 });
}
