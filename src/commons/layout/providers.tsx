import { Layout } from '@/commons/layout';
import { AuthProvider } from '@/commons/providers/auth/auth.provider';
import { ModalProvider } from '@/commons/providers/modal/modal.provider';
import { ToastProvider } from '@/commons/providers/toast/toast.provider';
import { createClient } from '@/lib/supabase/server';
import { getUserRouteWriteCount } from '@/services/course/courseService';
import { getUserTrackWriteCount } from '@/services/track/trackService';

export async function Providers({ children }: { children: React.ReactNode }) {
  let hasWrittenItem = false;
  let initialUser: import('@supabase/supabase-js').User | null = null;

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError && userError.message !== 'Auth session missing!') {
      console.error('[AppBody] getUser 실패:', userError.message);
    }

    initialUser = user ?? null;

    if (user?.is_anonymous === true) {
      const [courseResult, trackResult] = await Promise.all([
        getUserRouteWriteCount(user.id),
        getUserTrackWriteCount(user.id),
      ]);

      if (courseResult.error) {
        console.error('[AppBody] 게스트 코스 작성 횟수 조회 실패:', courseResult.error.message);
      }
      if (trackResult.error) {
        console.error('[AppBody] 게스트 트랙 작성 횟수 조회 실패:', trackResult.error.message);
      }

      const courseCount = courseResult.count ?? 0;
      const trackCount = trackResult.count ?? 0;
      hasWrittenItem = courseCount + trackCount >= 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[AppBody] 세션·작성 집계 초기화 중 오류:', message);
    hasWrittenItem = false;
  }

  return (
    <body className="antialiased">
      <AuthProvider initialUser={initialUser}>
        <ModalProvider>
          <ToastProvider>
            <Layout hasWrittenItem={hasWrittenItem}>{children}</Layout>
          </ToastProvider>
        </ModalProvider>
      </AuthProvider>
    </body>
  );
}
