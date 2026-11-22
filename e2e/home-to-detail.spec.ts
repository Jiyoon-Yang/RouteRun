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

// 느린 회선에서 SDK(1.25MB)가 뜨기 전 수 초 동안 목록이 텅 비어 보이지 않게, 첫 조회 전부터 스켈레톤을 보여 준다
test('지도가 뜨기 전에도 목록 자리에 스켈레톤이 보이고, 조회 후 카드로 바뀐다', async ({
  page,
}) => {
  // SDK 로더를 3초 붙잡아 두면 그동안은 지도도 첫 조회도 있을 수 없다. 그 안(2초)에 스켈레톤이 보여야 한다
  await page.route('**/tmap/vectorjs**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue();
  });
  const skeleton = page.locator('[aria-busy="true"]');

  await page.goto('/');
  await expect(skeleton).toBeVisible({ timeout: 2_000 });

  await expect(page.getByRole('link', { name: / 코스 선택$/ }).first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(skeleton).toHaveCount(0);
});

// 아주 느린 회선: 로더(vectorjs) 도착이 늦어도 지도가 떠야 한다. 예전 로더는 document.write 가로채기를
// 5초 고정으로 풀어, 그 뒤 도착한 vectorjs의 write가 무시돼 지도가 영영 안 떴다
test('TMap 로더가 7초 늦게 와도 지도와 코스 카드가 뜬다', async ({ page }) => {
  await page.route('**/tmap/vectorjs**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 7_000));
    await route.continue();
  });

  await page.goto('/');
  await expect(page.locator('#map_div .vsm-container')).toBeVisible({ timeout: 25_000 });
  // vectorjs의 두 번째 write(지도 CSS)도 가로채기 해제 전에 들어가야 한다
  await expect(page.locator('head link[href*="vsm.css"]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: / 코스 선택$/ }).first()).toBeVisible({
    timeout: 10_000,
  });
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
