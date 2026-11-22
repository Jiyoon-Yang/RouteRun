import { expect, test, type Page } from '@playwright/test';

// 흐름 1: 홈 지도 탐색 → 코스 상세. 운영 DB라 로그인·게스트 버튼·좋아요·등록은 누르지 않는다.
// Supabase로 GET·HEAD 외 요청이 하나라도 나가면 실패한다(첫 화면에 쓰기·익명 가입이 끼어들면 바로 드러나게).
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function watchSupabaseWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('.supabase.co') && !READ_METHODS.includes(request.method())) {
      writes.push(`${request.method()} ${request.url()}`);
    }
  });
  return writes;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hasSeenOnboarding', 'true'));
});

test('홈 지도에서 코스를 골라 상세로 간다 (Supabase 쓰기 요청 0건)', async ({ page }) => {
  const writes = watchSupabaseWrites(page);

  await page.goto('/');
  await expect(page.locator('#map_div .vsm-container')).toBeVisible();

  const firstCourse = page.getByRole('link', { name: / 코스 선택$/ }).first();
  await expect(firstCourse).toBeVisible();
  await firstCourse.click();

  await expect(page).toHaveURL(/\/courses\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading').first()).toBeVisible();

  expect(writes).toEqual([]);
});

// TMap SDK 로더는 (with-map) 레이아웃의 afterInteractive Script라 클라이언트 이동에서도 실행된다.
// beforeInteractive로 앞당기면 첫 로딩에만 실행돼, 마이페이지 카드(router.push) → 상세처럼 지도 없는 페이지에서
// 들어올 때 지도가 안 뜬다(2026-11-22 실험, docs/perf/baseline.md). 마이페이지는 로그인이 필요해 공지에서 같은 이동을 낸다.
test('지도 없는 페이지에서 클라이언트 이동(router.push)으로 홈에 와도 지도가 뜬다', async ({
  page,
}) => {
  const writes = watchSupabaseWrites(page);

  await page.goto('/notice');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() =>
    (window as unknown as { next: { router: { push: (href: string) => void } } }).next.router.push(
      '/',
    ),
  );

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#map_div .vsm-container')).toBeVisible({ timeout: 20_000 });

  expect(writes).toEqual([]);
});
