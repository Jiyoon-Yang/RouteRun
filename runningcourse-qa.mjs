/**
 * RunningCourse QA Script
 * 비로그인 / 익명 로그인 / 구글 로그인 세 가지 인증 상태에서 전체 라우트 검증
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const TIMEOUT = 10000;

const results = [];

function log(state, route, status, note = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : '🔍';
  const line = `${icon} [${state}] ${route} → ${status}${note ? ` (${note})` : ''}`;
  console.log(line);
  results.push({ state, route, status, note, line });
}

async function waitForPageLoad(page, url, options = {}) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT }).catch(() => {});
    return true;
  } catch (e) {
    return false;
  }
}

// ────────────────────────────────────────────
// 1. 비로그인 QA
// ────────────────────────────────────────────
async function qaNotLoggedIn(browser, courseId, trackId) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const STATE = '비로그인';

  console.log('\n═══ 비로그인 상태 QA ═══\n');

  // ── 공개 라우트 ──
  // /home
  await waitForPageLoad(page, `${BASE}/home`);
  const homeUrl = page.url();
  if (homeUrl.includes('/home') || homeUrl === `${BASE}/home`) {
    log(STATE, '/home', 'PASS', `접근 허용, URL: ${page.url()}`);
  } else {
    log(STATE, '/home', 'FAIL', `예상치 않은 리다이렉트: ${page.url()}`);
  }

  // /login
  await waitForPageLoad(page, `${BASE}/login`);
  const hasGoogleBtn = await page.locator('text=Google 계정으로 로그인').count();
  const hasGuestBtn = await page.locator('text=게스트 로그인').count();
  if (hasGoogleBtn > 0 && hasGuestBtn > 0) {
    log(STATE, '/login', 'PASS', 'Google/게스트 버튼 모두 존재');
  } else {
    log(STATE, '/login', 'FAIL', `Google: ${hasGoogleBtn}, Guest: ${hasGuestBtn}`);
  }

  // /notice
  await waitForPageLoad(page, `${BASE}/notice`);
  if (page.url().includes('/notice')) {
    log(STATE, '/notice', 'PASS', '접근 허용');
  } else {
    log(STATE, '/notice', 'FAIL', `리다이렉트됨: ${page.url()}`);
  }

  // /courses/[id] (공개)
  if (courseId) {
    await waitForPageLoad(page, `${BASE}/courses/${courseId}`);
    if (page.url().includes(`/courses/${courseId}`)) {
      log(STATE, `/courses/${courseId}`, 'PASS', '코스 상세 접근 허용');
    } else {
      log(STATE, `/courses/${courseId}`, 'FAIL', `리다이렉트됨: ${page.url()}`);
    }
  }

  // /tracks/[id] (공개)
  if (trackId) {
    await waitForPageLoad(page, `${BASE}/tracks/${trackId}`);
    if (page.url().includes(`/tracks/${trackId}`)) {
      log(STATE, `/tracks/${trackId}`, 'PASS', '트랙 상세 접근 허용');
    } else {
      log(STATE, `/tracks/${trackId}`, 'FAIL', `리다이렉트됨: ${page.url()}`);
    }
  }

  // ── private 라우트 → /login 리다이렉트 기대 ──
  const privateRoutes = [
    '/report',
    '/courses/new',
    '/tracks/new',
    '/mypage',
    courseId ? `/courses/${courseId}/edit` : null,
    trackId ? `/tracks/${trackId}/edit` : null,
  ].filter(Boolean);

  for (const route of privateRoutes) {
    await waitForPageLoad(page, `${BASE}${route}`);
    const finalUrl = page.url();
    if (finalUrl.includes('/login')) {
      log(STATE, route, 'PASS', `→ /login 리다이렉트 확인`);
    } else {
      log(STATE, route, 'FAIL', `리다이렉트 안됨, 현재: ${finalUrl}`);
    }
  }

  // ── 로그인 페이지 redirect_to 파라미터 확인 ──
  await waitForPageLoad(page, `${BASE}/mypage`);
  const redirectParam = page.url().includes('redirect_to');
  if (redirectParam) {
    log(STATE, '/mypage → /login', 'PASS', 'redirect_to 파라미터 포함');
  } else {
    log(STATE, '/mypage → /login', 'WARN', `redirect_to 파라미터 없음: ${page.url()}`);
  }

  await ctx.close();
}

// ────────────────────────────────────────────
// 2. 익명(게스트) 로그인 QA
// ────────────────────────────────────────────
async function qaAnonymousLogin(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const STATE = '익명로그인';

  console.log('\n═══ 익명(게스트) 로그인 상태 QA ═══\n');

  // 게스트 로그인
  await waitForPageLoad(page, `${BASE}/login`);
  const guestBtn = page.locator('text=게스트 로그인');
  const btnCount = await guestBtn.count();
  if (btnCount === 0) {
    log(STATE, '/login', 'FAIL', '게스트 로그인 버튼 없음');
    await ctx.close();
    return { ctx, courseId: null, trackId: null };
  }
  await guestBtn.click();

  // 로그인 후 리다이렉트 대기
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 10000 }).catch(() => {});
  const afterLoginUrl = page.url();
  if (!afterLoginUrl.includes('/login')) {
    log(STATE, '게스트 로그인', 'PASS', `이동됨: ${afterLoginUrl}`);
  } else {
    log(STATE, '게스트 로그인', 'FAIL', `로그인 실패 또는 리다이렉트 안됨`);
  }

  // ── 공개 라우트 ──
  await waitForPageLoad(page, `${BASE}/home`);
  log(STATE, '/home', page.url().includes('/home') ? 'PASS' : 'FAIL',
    page.url().includes('/home') ? '접근 허용' : `리다이렉트: ${page.url()}`);

  await waitForPageLoad(page, `${BASE}/notice`);
  log(STATE, '/notice', page.url().includes('/notice') ? 'PASS' : 'FAIL',
    page.url().includes('/notice') ? '접근 허용' : `리다이렉트: ${page.url()}`);

  // ── private 라우트 — 세션 있으므로 접근 허용 기대 ──
  const privateRoutesAnon = [
    '/report',
    '/courses/new',
    '/tracks/new',
    '/mypage',
  ];

  for (const route of privateRoutesAnon) {
    await waitForPageLoad(page, `${BASE}${route}`);
    const finalUrl = page.url();
    if (finalUrl.includes('/login')) {
      log(STATE, route, 'FAIL', `예상치 않은 /login 리다이렉트`);
    } else if (finalUrl.includes(route) || route === '/mypage' && finalUrl.includes('/mypage')) {
      log(STATE, route, 'PASS', `접근 허용 (세션 있음)`);
    } else {
      log(STATE, route, 'WARN', `예상 밖 URL: ${finalUrl}`);
    }
  }

  // ── 코스/트랙 ID 수집 (홈에서) ──
  await waitForPageLoad(page, `${BASE}/home`);
  const courseLinks = await page.$$eval('a[href^="/courses/"]', (els) =>
    els.map((el) => el.getAttribute('href')).filter((h) => h && !h.includes('/new') && !h.includes('/edit'))
  );
  const trackLinks = await page.$$eval('a[href^="/tracks/"]', (els) =>
    els.map((el) => el.getAttribute('href')).filter((h) => h && !h.includes('/new') && !h.includes('/edit'))
  );

  const courseId = courseLinks[0]?.split('/')[2] ?? null;
  const trackId = trackLinks[0]?.split('/')[2] ?? null;

  console.log(`  → 발견된 코스 링크: ${courseLinks.length}개, 트랙 링크: ${trackLinks.length}개`);
  if (courseId) console.log(`  → 첫 번째 코스 ID: ${courseId}`);
  if (trackId) console.log(`  → 첫 번째 트랙 ID: ${trackId}`);

  // 코스 상세
  if (courseId) {
    await waitForPageLoad(page, `${BASE}/courses/${courseId}`);
    log(STATE, `/courses/${courseId}`, page.url().includes(courseId) ? 'PASS' : 'FAIL', '상세 접근');

    // 좋아요 버튼 확인
    const likeBtn = page.locator('[aria-label*="좋아요"], [data-testid*="like"], button:has-text("좋아요")');
    const likeBtnCount = await likeBtn.count();
    if (likeBtnCount > 0) {
      log(STATE, `/courses/${courseId} 좋아요`, 'PASS', `좋아요 버튼 존재 (${likeBtnCount}개)`);
      // 좋아요 클릭 시도 — 게스트는 어떻게 처리?
      await likeBtn.first().click().catch(() => {});
      await page.waitForTimeout(1500);
      const modal = await page.locator('[role="dialog"], .modal, [class*="modal"]').count();
      if (modal > 0) {
        const modalText = await page.locator('[role="dialog"], .modal, [class*="modal"]').first().textContent().catch(() => '');
        log(STATE, `/courses/${courseId} 좋아요 클릭`, 'PASS', `모달 표시됨: "${modalText?.slice(0, 40)}"`);
      } else {
        log(STATE, `/courses/${courseId} 좋아요 클릭`, '🔍', '모달 없음 - 다른 방식으로 처리됨');
      }
    } else {
      log(STATE, `/courses/${courseId} 좋아요`, 'WARN', '좋아요 버튼 미발견');
    }
  }

  // 트랙 상세
  if (trackId) {
    await waitForPageLoad(page, `${BASE}/tracks/${trackId}`);
    log(STATE, `/tracks/${trackId}`, page.url().includes(trackId) ? 'PASS' : 'FAIL', '상세 접근');
  }

  // ── /mypage 게스트 UI 확인 ──
  await waitForPageLoad(page, `${BASE}/mypage`);
  const profileEditBtn = await page.locator('button:has-text("수정"), [aria-label*="수정"], [aria-label*="프로필"]').count();
  log(STATE, '/mypage 프로필 수정 버튼', profileEditBtn > 0 ? 'PASS' : 'WARN',
    profileEditBtn > 0 ? '버튼 존재' : '버튼 미발견');

  // ── Navigation bar + 코스 생성 ──
  await waitForPageLoad(page, `${BASE}/home`);
  const newCourseNavBtn = page.locator('a[href="/courses/new"], button:has-text("코스 등록")');
  const newCourseNavBtnCount = await newCourseNavBtn.count();
  if (newCourseNavBtnCount > 0) {
    log(STATE, 'nav 코스 생성 버튼', 'PASS', '존재함');
  } else {
    log(STATE, 'nav 코스 생성 버튼', 'WARN', '미발견');
  }

  await ctx.close();
  return { courseId, trackId };
}

// ────────────────────────────────────────────
// 3. 구글 로그인 — 리다이렉트까지만 테스트
// ────────────────────────────────────────────
async function qaGoogleLogin(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const STATE = '구글로그인';

  console.log('\n═══ 구글 로그인 상태 QA (OAuth redirect까지) ═══\n');

  await waitForPageLoad(page, `${BASE}/login`);
  const googleBtn = page.locator('text=Google 계정으로 로그인');
  const count = await googleBtn.count();

  if (count === 0) {
    log(STATE, '/login Google 버튼', 'FAIL', '버튼 없음');
    await ctx.close();
    return;
  }

  log(STATE, '/login Google 버튼', 'PASS', '존재함');

  // 클릭 후 redirect URL 확인 (실제 OAuth 완료는 불가)
  await googleBtn.click();
  await page.waitForURL((url) => !url.toString().startsWith('http://localhost'), { timeout: 8000 }).catch(() => {});
  const redirectUrl = page.url();

  if (redirectUrl.includes('accounts.google.com') || redirectUrl.includes('supabase') || redirectUrl.includes('oauth')) {
    log(STATE, '구글 OAuth redirect', 'PASS', `리다이렉트 URL: ${redirectUrl.split('?')[0]}`);
  } else if (redirectUrl.includes('localhost')) {
    log(STATE, '구글 OAuth redirect', 'FAIL', `여전히 localhost: ${redirectUrl}`);
  } else {
    log(STATE, '구글 OAuth redirect', 'WARN', `예상 밖 URL: ${redirectUrl.slice(0, 80)}`);
  }

  // 참고: 실제 구글 로그인 완료·콜백 검증은 수동 또는 credential mocking 필요
  log(STATE, '구글 OAuth 완료 후 UI 검증', '🔍', '자동화 불가 (실제 Google 계정 필요) — 수동 검증 필요');

  await ctx.close();
}

// ────────────────────────────────────────────
// 실행
// ────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });

  // 익명 로그인으로 courseId/trackId 수집
  const { courseId, trackId } = await qaAnonymousLogin(browser);

  // 비로그인 — 수집된 ID 재사용
  await qaNotLoggedIn(browser, courseId, trackId);

  // 구글 로그인 redirect 테스트
  await qaGoogleLogin(browser);

  await browser.close();

  // ── 결과 요약 ──
  console.log('\n' + '═'.repeat(60));
  console.log('QA 결과 요약');
  console.log('═'.repeat(60));

  const grouped = {};
  for (const r of results) {
    if (!grouped[r.state]) grouped[r.state] = { PASS: 0, FAIL: 0, WARN: 0, probe: 0 };
    if (r.status === 'PASS') grouped[r.state].PASS++;
    else if (r.status === 'FAIL') grouped[r.state].FAIL++;
    else if (r.status === 'WARN') grouped[r.state].WARN++;
    else grouped[r.state].probe++;
  }

  for (const [state, counts] of Object.entries(grouped)) {
    console.log(`\n[${state}] PASS: ${counts.PASS} | FAIL: ${counts.FAIL} | WARN: ${counts.WARN} | 🔍: ${counts.probe}`);
  }

  const fails = results.filter((r) => r.status === 'FAIL');
  const warns = results.filter((r) => r.status === 'WARN');

  if (fails.length > 0) {
    console.log('\n── FAIL 목록 ──');
    fails.forEach((r) => console.log(r.line));
  }
  if (warns.length > 0) {
    console.log('\n── WARN 목록 ──');
    warns.forEach((r) => console.log(r.line));
  }

  if (fails.length === 0 && warns.length === 0) {
    console.log('\n모든 항목 PASS — 발견된 이슈 없음');
  }

  console.log('\n⚠️  구글 로그인 완료 후 상태는 수동 검증 필요 (OAuth credentials 없음)');
})();
