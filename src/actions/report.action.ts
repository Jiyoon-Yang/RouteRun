'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { ROUTES } from '@/commons/constants/url';
import type { ReportTarget, ReportType } from '@/commons/types/routerun';
import { isValidReportTarget } from '@/commons/utils/report-target';
import { createClient } from '@/lib/supabase/server';
import * as reportRepository from '@/repositories/report.repository';
import { isSuspended, SUSPENDED_MESSAGE } from '@/services/user/userService';

export type SubmitReportInput = {
  type: ReportType;
  content: string;
  /** 게시물 신고(type 'content')일 때만 */
  target?: ReportTarget;
};

export type SubmitReportActionResult = { success: true } | { success: false; message: string };

const VALID_TYPES: ReportType[] = ['bug', 'inconvenience', 'suggestion', 'content'];
const TARGET_LABEL: Record<ReportTarget['type'], string> = { route: '코스', track: '트랙' };

// 게스트 세션은 무제한 생성 가능하므로 유저당 접수 횟수로 스팸(메일 폭주)을 막는다.
// shortcut: 조회 후 insert라 동시 요청은 한도를 조금 넘을 수 있음, 악용되면 DB 트리거로 강제.
const REPORT_LIMIT_COUNT = 3;
const REPORT_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// 게스트 세션을 계속 새로 만들면 유저당 한도는 우회되므로, 하루 전체 메일 발송량도 막아 쿼터를 지킨다.
// 접수(DB 저장)까지 막으면 한도를 채우는 것만으로 정상 제보가 차단되므로 메일만 건너뛴다.
const REPORT_EMAIL_DAILY_LIMIT = 50;
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

  if (await isSuspended(supabase)) {
    return { success: false, message: SUSPENDED_MESSAGE };
  }

  if (!VALID_TYPES.includes(input.type)) {
    return { success: false, message: '제보 유형을 선택해주세요.' };
  }

  // 게시물 신고만 대상이 있어야 한다(DB check 제약과 같은 규칙)
  const isContentReport = input.type === 'content';
  if (isContentReport !== isValidReportTarget(input.target)) {
    return { success: false, message: '신고할 게시물을 찾을 수 없습니다.' };
  }
  const target = isContentReport ? input.target : undefined;

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

  const { data, error } = await reportRepository.createReport(serviceSupabase, {
    user_id: user.id,
    type: input.type,
    content: trimmed,
    target,
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
  const emailQuotaReached = globalResult.count >= REPORT_EMAIL_DAILY_LIMIT;
  if (edgeFunctionUrl && !reportEmailSecret) {
    console.error('[report] REPORT_EMAIL_SECRET 미설정으로 이메일 발송 생략');
  }
  if (emailQuotaReached) {
    console.warn('[report] 하루 메일 발송 한도 도달로 이메일 발송 생략 (제보는 저장됨)');
  }
  // 메일 함수(Edge Function)를 다시 배포하지 않도록 신고 대상 링크는 본문 앞에 붙인다
  const targetPath =
    target &&
    (target.type === 'route' ? ROUTES.COURSES.DETAIL(target.id) : ROUTES.TRACKS.DETAIL(target.id));
  const emailContent = target
    ? `[신고 대상: ${TARGET_LABEL[target.type]} ${process.env.NEXT_PUBLIC_SITE_URL ?? ''}${targetPath}]\n${data.content}`
    : data.content;
  if (edgeFunctionUrl && reportEmailSecret && !emailQuotaReached) {
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
          content: emailContent,
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
