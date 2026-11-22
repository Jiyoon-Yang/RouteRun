import { expect, test } from '@playwright/test';

// 흐름 1: 홈 지도 탐색 → 코스 상세. 운영 DB라 로그인·게스트 버튼·좋아요·등록은 누르지 않는다.
// Supabase로 GET·HEAD 외 요청이 하나라도 나가면 실패한다(첫 화면에 쓰기·익명 가입이 끼어들면 바로 드러나게).
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

test('홈 지도에서 코스를 골라 상세로 간다 (Supabase 쓰기 요청 0건)', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('.supabase.co') && !READ_METHODS.includes(request.method())) {
      writes.push(`${request.method()} ${request.url()}`);
    }
  });
  await page.addInitScript(() => localStorage.setItem('hasSeenOnboarding', 'true'));

  await page.goto('/');
  await expect(page.locator('canvas').first()).toBeVisible();

  const firstCourse = page.getByRole('link', { name: / 코스 선택$/ }).first();
  await expect(firstCourse).toBeVisible();
  await firstCourse.click();

  await expect(page).toHaveURL(/\/courses\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading').first()).toBeVisible();

  expect(writes).toEqual([]);
});
