import { redirect } from 'next/navigation';

import { parseReportTarget } from '@/commons/utils/report-target';
import { ReportPage } from '@/components/report';
import { createClient } from '@/lib/supabase/server';

export default async function Page({
  searchParams,
}: {
  searchParams: { target?: string | string[] };
}) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) {
    if (userError) {
      console.error('[ReportPage] getUser 실패:', userError.message);
    }
    redirect('/login');
  }

  // ?target=route:<id>면 게시물 신고, 형식이 틀리면 일반 제보로 연다
  return <ReportPage target={parseReportTarget(searchParams.target) ?? undefined} />;
}
