import { redirect } from 'next/navigation';

import TrackSubmit from '@/components/tracks-submit';
import { createClient } from '@/lib/supabase/server';
import { isGuestWriteLimitReached } from '@/services/user/userService';

export default async function TrackNewPage() {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) {
    if (userError) {
      console.error('[TrackNewPage] getUser 실패:', userError.message);
    }
    redirect('/login');
  }

  if (user.is_anonymous === true && (await isGuestWriteLimitReached(user.id))) {
    redirect('/mypage?error=guest_limit_exceeded');
  }

  return <TrackSubmit mode="new" />;
}
