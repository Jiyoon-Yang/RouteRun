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
  if (edgeFunctionUrl) {
    try {
      await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId: data.user_id,
          type: data.type,
          content: data.content,
          createdAt: data.created_at,
        }),
      });
    } catch (emailError) {
      console.error('[report] 이메일 발송 실패:', emailError);
    }
  }

  return { success: true };
}
