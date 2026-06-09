import { redirect } from 'next/navigation';

import { ReportPage } from '@/components/report';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
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

  return <ReportPage />;
}
