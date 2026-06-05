import { redirect } from 'next/navigation';

import TrackSubmit from '@/components/track-submit';
import { createClient } from '@/lib/supabase/server';
import { getUserRouteWriteCount } from '@/services/course/courseService';
import { getUserTrackWriteCount } from '@/services/track/trackService';

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

  const isGuestUser = user.is_anonymous === true;

  if (isGuestUser) {
    const [courseResult, trackResult] = await Promise.all([
      getUserRouteWriteCount(user.id),
      getUserTrackWriteCount(user.id),
    ]);

    const hasError = courseResult.error !== null || trackResult.error !== null;
    const courseCount = courseResult.count ?? null;
    const trackCount = trackResult.count ?? null;
    const totalCount = courseCount !== null && trackCount !== null ? courseCount + trackCount : null;
    const limitExceededOrUnsafe = hasError || totalCount === null || totalCount >= 1;

    if (limitExceededOrUnsafe) {
      if (hasError) {
        console.error('[TrackNewPage] 게스트 코스·트랙 개수 조회 실패 — 진입 차단');
      } else if (totalCount === null) {
        console.error(
          '[TrackNewPage] 게스트 코스·트랙 개수가 null — 진입 차단 (userId 일부):',
          user.id.slice(0, 8),
        );
      }
      redirect('/mypage?error=guest_limit_exceeded');
    }
  }

  return <TrackSubmit mode="new" />;
}
