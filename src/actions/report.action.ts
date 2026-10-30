'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { ReportType } from '@/commons/types/routerun';
import { createClient } from '@/lib/supabase/server';
import * as reportRepository from '@/repositories/report.repository';

export type SubmitReportInput = {
  type: ReportType;
  content: string;
};

export type SubmitReportActionResult = { success: true } | { success: false; message: string };

const VALID_TYPES: ReportType[] = ['bug', 'inconvenience', 'suggestion'];

// 게스트 세션은 무제한 생성 가능하므로 유저당 접수 횟수로 스팸(메일 폭주)을 막는다.
// shortcut: 조회 후 insert라 동시 요청은 한도를 조금 넘을 수 있음, 악용되면 DB 트리거로 강제.
const REPORT_LIMIT_COUNT = 3;
const REPORT_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// 게스트 세션을 계속 새로 만들면 유저당 한도는 우회되므로, 하루 전체 접수량도 막아 메일 쿼터를 지킨다.
const REPORT_GLOBAL_DAILY_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function submitReportAction(
  input: SubmitReportInput,
): Promise<SubmitReportActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: '로그인이 필요합니다.' };
  }

  if (!VALID_TYPES.includes(input.type)) {
    return { success: false, message: '제보 유형을 선택해주세요.' };
  }

  const trimmed = input.content.trim();
  if (trimmed.length < 10) {
    return { success: false, message: '내용을 10자 이상 입력해주세요.' };
  }
  if (trimmed.length > 500) {
    return { success: false, message: '내용은 500자 이하로 입력해주세요.' };
  }

  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const now = Date.now();
  const [userResult, globalResult] = await Promise.all([
    reportRepository.countReportsSince(
      serviceSupabase,
      new Date(now - REPORT_LIMIT_WINDOW_MS).toISOString(),
      user.id,
    ),
    reportRepository.countReportsSince(serviceSupabase, new Date(now - DAY_MS).toISOString()),
  ]);
  if (
    userResult.error ||
    userResult.count === null ||
    globalResult.error ||
    globalResult.count === null
  ) {
    console.error(
      '[report] 최근 제보 수 조회 실패:',
      userResult.error?.message ?? globalResult.error?.message,
    );
    return { success: false, message: '제보 접수에 실패했습니다. 다시 시도해주세요.' };
  }
  if (userResult.count >= REPORT_LIMIT_COUNT) {
    return {
      success: false,
      message: '제보는 10분에 3건까지 가능합니다. 잠시 후 다시 시도해주세요.',
    };
  }
  if (globalResult.count >= REPORT_GLOBAL_DAILY_LIMIT) {
    console.warn('[report] 하루 전체 제보 한도 도달');
    return {
      success: false,
      message: '지금은 제보가 많이 몰려 접수할 수 없습니다. 내일 다시 시도해주세요.',
    };
  }

  const { data, error } = await reportRepository.createReport(serviceSupabase, {
    user_id: user.id,
    type: input.type,
    content: trimmed,
  });

  if (error || !data) {
    console.error(
      '[report] DB 저장 실패 code:',
      error?.code,
      'message:',
      error?.message,
      'details:',
      error?.details,
    );
    return { success: false, message: '제보 접수에 실패했습니다. 다시 시도해주세요.' };
  }

  const edgeFunctionUrl = process.env.REPORT_EDGE_FUNCTION_URL;
  const reportEmailSecret = process.env.REPORT_EMAIL_SECRET;
  if (edgeFunctionUrl && !reportEmailSecret) {
    console.error('[report] REPORT_EMAIL_SECRET 미설정으로 이메일 발송 생략');
  }
  if (edgeFunctionUrl && reportEmailSecret) {
    try {
      const emailRes = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'x-report-secret': reportEmailSecret,
        },
        body: JSON.stringify({
          userId: data.user_id,
          type: data.type,
          content: data.content,
          createdAt: data.created_at,
        }),
      });
      if (!emailRes.ok) {
        console.error('[report] 이메일 발송 실패 status:', emailRes.status);
      }
    } catch (emailError) {
      console.error('[report] 이메일 발송 실패:', emailError);
    }
  }

  return { success: true };
}
