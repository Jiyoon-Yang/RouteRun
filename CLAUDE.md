# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

**RunningCourse**는 위치 기반 러닝 코스 커뮤니티 웹앱입니다.
주요 기능: 지도 기반 코스·트랙 탐색 (TMap SDK), 폴리라인으로 코스/트랙 생성, 사용자 인증 (Google OAuth + 익명 세션), 좋아요 기능.

## 주요 명령어

```bash
npm run dev              # 개발 서버 (localhost:3000)
npm run build            # 프로덕션 빌드
npm run lint             # ESLint 실행
npx tsc --noEmit        # TypeScript 타입 체크 (빌드 없이)
npm run storybook        # Storybook (localhost:6006)
npm run build-storybook  # Storybook 정적 사이트 빌드
npm test                 # 단위 테스트 (Vitest node 모드): unit(src/**/*.test.ts) + admin(admin/src/**/*.test.ts, 어드민 권한 가드)
npx vitest run --project storybook  # Storybook 컴포넌트/인터랙션·a11y 테스트 (Vitest 브라우저 모드, Playwright chromium)
npm run e2e              # 홈→코스 상세 스모크 (Playwright, 운영 DB 읽기 전용, 로컬 전용)
npm run perf             # 성능 기준선 측정 (docs/perf/baseline.md와 비교)

# 어드민 앱 (admin/, 별도 package.json·eslint·tsconfig. 루트 tsconfig는 admin을 exclude)
cd admin && npm run lint && npm run typecheck
```

## 작업 방식

- **끝 기준과 절차는 `/ship` 스킬:** 워크트리 → 검증 → dev PR → Claude 리뷰(P0·P1 0건까지 최대 3회) → dev 머지·정리. 바꾼 곳별 검증 명령, PR 템플릿도 거기 있다
- 최소 검증은 항상 `npx tsc --noEmit`, `npm run lint`, `npm test`. 어드민을 바꿨으면 `cd admin && npm run lint && npm run typecheck`(루트 명령은 어드민을 검사하지 않는다)
- **멈추는 곳은 `.claude/hooks/guard.sh`가 강제:** main 머지·push는 차단, 운영 Supabase·배포·`.env`·일회성 스크립트·CI 설정 수정은 확인. Supabase는 운영 DB 하나뿐이다
- 어드민 테스트는 루트 `npm test`의 admin 프로젝트다. 어드민 `*.test.ts`는 Vercel 빌드에 vitest가 없어 어드민 tsconfig에서 뺐으므로 **타입 검사를 받지 않고**, 루트 vitest라 `next`가 루트(Next 14)로 풀릴 수 있으니 Next API를 mock해서 쓴다
- 반복되는 실수는 이 문서에 설명을 늘리기보다 ESLint 규칙·타입·테스트로 막는 쪽을 먼저 고려한다

## 아키텍처

**스택:** Next.js 14 App Router · TypeScript · CSS Modules · Supabase (인증 + DB) · TMap Vector SDK

**데이터 흐름:**

```
변경(mutation): Client Component → Server Action (src/actions/) → Service (src/services/) → Repository (src/repositories/) → Supabase
서버 조회:      Server Component(page) → Service → Repository
클라이언트 조회: 훅 → Service/Repository (홈 지도 뷰포트, 좋아요 상태, TMap REST — 클라이언트 Supabase 사용)
```

- **Repositories**: DB 쿼리(`.from`, `.rpc`, `.storage`)를 두는 곳. 새 쿼리는 반드시 여기에 둔다. 아래 예외 외에 Page·Component·Service·Action에 쿼리를 새로 쓰지 않는다
  - 기존 예외(일부러 고치지 않는다): `courseLikeService`/`trackLikeService`의 좋아요 상태 조회, `commons/utils/storage.ts`의 이미지 업로드, `app/auth/callback/route.ts`의 `users.is_anonymous` 갱신, `auth.action.ts`의 게스트 계정 삭제(Service Role Admin API)
- **Supabase 클라이언트 생성과 `auth.getUser()` 세션 확인**은 Page·Action·Route Handler·`Providers`에서 해도 된다. 만든 클라이언트는 Service/Repository에 주입한다. ESLint(`.eslintrc.json`·`admin/eslint.config.mjs`의 `no-restricted-imports`)가 그 밖의 Supabase import를 막는다. 허용·기존 예외 파일 목록은 거기 있고, 예외를 늘리지 않는다
  - 클라이언트 생성 기존 예외(일부러 고치지 않는다): 위 쿼리 예외의 `courseLikeService`·`trackLikeService`·`commons/utils/storage.ts`, 그리고 서버 클라이언트를 직접 만드는 `courseDetailService`·`trackDetailService`·`userService`
- **Server Actions**: 인증, 코스·트랙 CRUD, 좋아요, 제보 등 mutation 처리. 조합·도메인 규칙이 없으면 Service 없이 Repository를 바로 불러도 된다(`createCourseAction`, 좋아요 토글)
- **Services**: 여러 Repository 결과 조합, 도메인 규칙, View Model 변환
- 레이어별 세부 규칙은 `src/actions/CLAUDE.md`, `src/services/CLAUDE.md`, `src/repositories/CLAUDE.md`

**라우트 그룹:** `src/app/(with-map)/`은 TMap이 필요한 라우트(홈, 코스/트랙 상세·생성·수정), `(no-map)/`은 TMap 없이 렌더링(로그인, 마이페이지, 신고, 공지). 공통 UI·훅·상수·프로바이더는 `src/commons/`.

## 어드민 앱 (`admin/`)

사용자 앱과 별개인 Next.js 16 + Tailwind + shadcn/ui(Base UI) 앱. 규칙·주의는 `admin/CLAUDE.md`(README·ROADMAP 포함)에 있고, 깨지면 치명적인 것만 여기 적는다.

- **데이터 흐름:** `page.tsx`는 `components/<기능>`을 렌더만 한다. 데이터는 컴포넌트 훅 → Server Action → Service → Repository. page에서 직접 조회하지 않는다
- **권한:** 로그인·로그아웃(`auth.action.ts`의 `signInAction`/`signOutAction`, 로그인 전에 불리므로 넣으면 로그인이 막힌다)을 뺀 모든 Server Action은 첫 줄에서 `requireAdmin()`(`admin/src/lib/require-admin.ts`)을 호출한다. `(admin)` 레이아웃 검사만으로는 부족하다(클라이언트 이동 때 레이아웃은 다시 안 돌고, 액션은 직접 호출될 수 있다). 어드민 여부는 `admins` 테이블(`admin.repository.ts`의 `isAdmin`)로만 판단한다
- **Service Role:** `createAdminClient()`는 `admin/src/lib/supabase/admin.ts` 한 곳(`server-only`)에서만 만든다. 보통 Service에서 만들어 Repository에 주입하고, Action이 Service 없이 Repository를 바로 부를 때는 Action에서 만든다(`dashboard.action.ts`·`report.action.ts`의 `countPendingReports`. 어드민 README "주의"의 예외와 같다)
- **조치 기록:** 숨김·삭제·상태 변경 같은 조치는 `logAdminAction()`으로 `admin_logs`에 남긴다(무엇을 기록하는지는 ROADMAP 단계별 메모)

## 인증

`AuthProvider` (`src/commons/providers/auth/`)가 세 가지 플래그를 제공합니다:

- `isLoggedIn` — 세션 존재 여부 (게스트/익명 포함)
- `isAuthenticated` — 실제 OAuth 로그인 유저 (익명 아님)
- `isAnonymous` — 게스트 세션

`Providers` (`src/commons/layout/providers.tsx`)는 `AuthProvider`, `ModalProvider`, `ToastProvider`를 한 번에 래핑하는 Server Component다. 단순 래퍼가 아니라 익명 유저의 코스·트랙 작성 횟수를 서버에서 집계해 `hasWrittenItem` 플래그로 레이아웃에 주입한다.

미들웨어 (`src/middleware.ts`. `src/app`을 쓰므로 루트에 두면 Next가 조용히 무시한다, `middleware.test.ts`가 막음)는 모든 요청에서 세션을 갱신하고 비공개 라우트를 보호하며, 로그인했지만 약관에 동의하지 않은 사용자를 `/agree`로 보냅니다(동의 기록은 user_metadata `terms_agreed_at`). 세션이 없는 경우(완전 미로그인)만 차단하고 `/login`으로 리다이렉트합니다. 익명(게스트) 세션은 라우트를 통과합니다. 이 보호 로직과 비공개 라우트 목록을 요청 없이 완화하지 않는다. 게스트는 좋아요·제보·본인 글 수정/삭제가 가능하고, 코스·트랙 작성만 합산 1개로 제한됩니다 (`isGuestWriteLimitReached`, 등록 페이지와 등록 Action 양쪽에서 검사).

**비공개 라우트:** `/courses/new`, `/courses/[id]/edit`, `/tracks/new`, `/tracks/[id]/edit`, `/mypage`, `/report` (정의: `src/commons/constants/url.ts`의 `PRIVATE_ROUTES`·`PRIVATE_DYNAMIC_PATTERNS`)

## DB 스키마 (Supabase Postgres)

- `users`: `id, nickname, profile_image_url, is_anonymous, created_at`
- `routes`: `id, user_id, title, description, distance_meters, path_data (JSON), is_round_trip (boolean), start_lat, start_lng, start_address_region, image_urls, likes_count, is_hidden, created_at, updated_at`
- `route_likes`: 복합키 `(user_id, route_id)`, `created_at`
- `tracks`: `id, user_id, title, description, distance_meters, start_lat, start_lng, start_address_region, image_urls, likes_count, is_hidden, created_at, updated_at` (routes와 달리 `path_data` 없음)
- `track_likes`: 복합키 `(user_id, track_id)`, `created_at`
- `reports`: `id, user_id, type ('bug'|'inconvenience'|'suggestion'), content, status ('open'|'in_progress'|'resolved', 기본 'open'), admin_note, handled_at, created_at` — Service Role 클라이언트로만 읽고 쓴다(anon·authenticated 정책·권한 없음). `status`·`admin_note`·`handled_at`은 어드민 제보 처리함이 쓴다
- `admin_logs`: `id, admin_id (auth.users), action, target, reason, created_at` — 어드민 조치 기록. RLS 정책 없음(Service Role 전용)
- `admins`: `user_id (auth.users), created_at` — 어드민 로그인 허용 명단. 본인 행만 조회 가능
- `notices`: `id, title, body, status ('draft'|'published'), pinned, published_at, created_at, updated_at` — 공지. 누구나 게시된 공지만 읽고(RLS), 쓰기는 어드민 Service Role만. 고정은 초안 포함 전체 1개(partial unique index)
- 스토리지 버킷: `course_images` (공개)

`supabase/migrations/`에는 likes_count 트리거와 어드민용 변경(`admins`, `reports` 처리 컬럼과 권한 정리, `admin_logs`, `notices`, 코스·트랙 숨김)만 있다. 나머지 테이블 구조는 위 목록과 `src/repositories/{course,track}/*-row.ts`를 기준으로 본다.
`supabase/functions/send-report-email/` — 제보 메일 Edge Function (Deno + Resend). 함수 secrets: `RESEND_API_KEY`, `REPORT_EMAIL_TO`, `REPORT_EMAIL_SECRET`

## 환경 변수

`.env.local`에 필수 설정:

```
NEXT_PUBLIC_TMAP_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REPORT_EDGE_FUNCTION_URL=        # 선택. 제보 접수 시 이메일 발송용 Edge Function URL
REPORT_EMAIL_SECRET=             # 선택. Edge Function 호출 인증용 비밀값. 함수 쪽 `supabase secrets set REPORT_EMAIL_SECRET=...`과 같은 값
GA_ID=                           # 선택. GA4 측정 ID. Vercel Production에만 설정 (없으면 GA 스크립트를 넣지 않음)
```

## 코딩 컨벤션

- **스타일:** 컴포넌트별 CSS Modules; 인라인 스타일 금지. 색상·타이포그래피 등 상수는 `src/commons/constants/`에 위치.
- **경로 별칭:** `@/*` → `src/*`
- **컴포넌트:** 스토리 (`.stories.tsx`), 스타일 (`.module.css`), 컴포넌트 전용 훅을 같은 디렉토리에 위치.
- **`console.log` 사용 금지** (ESLint 경고); `console.error/warn/info`는 허용.
- **React Strict Mode** 비활성화 (`next.config.mjs`).
- import 순서는 ESLint로 강제: 외부 → 내부 → 상대경로.
- 위 `console.log`·import 순서 규칙은 서비스 앱(`.eslintrc.json`)에만 걸려 있다. 어드민(`admin/eslint.config.mjs`)은 next 기본 규칙뿐이니 같은 규칙을 손으로 지킨다.
- `'use client'`는 상호작용이 필요한 가장 작은 컴포넌트에만 붙이고 상위로 끌어올리지 않는다.
- **SVG:** `next.config.mjs` webpack 설정으로 `.svg`를 `import`로 사용 가능 (asset/resource로 처리됨).

## Git 워크플로우

- `main` — 프로덕션 전용. main에 머지되면 Vercel 운영에 바로 배포된다. 반영은 사용자가 `/release-pr`로 만든 PR을 merge commit으로 머지
- `dev` — 통합 브랜치; 모든 기능은 `feat/<기능명>`에서 PR로 머지(절차는 `/ship`)
- Claude 리뷰(`claude-code-action`)는 워크플로 파일이 main과 같을 때만 돈다. `claude-review.yml`을 고치는 PR은 리뷰가 skip되므로 따로 분리하고 dev 머지 직후 main까지 반영한다

## Gotchas

- **TMap SDK 로딩:** `(with-map)/layout.tsx`에서 인라인 스크립트로 로드. `document.write` 호환을 위한 우회 로직 포함. TMap 관련 이슈 발생 시 이 레이아웃을 먼저 확인. 지도 전체가 이 로직에 걸려 있으니 요청 없이 리팩터링하거나 `useEffect`로 옮기지 않는다.
- **Service Role 키(`SUPABASE_SERVICE_ROLE_KEY`)는 서버에서만:** 서비스 앱은 `report.action.ts`(제보 저장·집계)·`auth.action.ts`(게스트 계정 삭제)에서만 쓰고 ESLint가 그 밖을 막는다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다. `reports`·`admin_logs`는 anon·authenticated 권한이 없어 Service Role로만 읽고 쓴다.
- **익명 세션 vs 미로그인:** 미들웨어는 세션 없는 경우만 차단. 익명 세션은 통과하며, 게스트 작성 제한(코스·트랙 합산 1개)만 `userService.isGuestWriteLimitReached`로 서버에서 강제한다. 좋아요는 게스트도 허용.
- **`likes_count`는 DB 트리거(`sync_route_likes_count`/`sync_track_likes_count`, SECURITY DEFINER)만 갱신한다:** routes·tracks UPDATE는 작성자 본인만 허용돼 앱 코드로 올리면 남의 글 좋아요가 반영되지 않던 버그가 있었다. 좋아요 Action은 카운트를 읽기만 하고, 직접 쓰는 코드는 ESLint가 막는다.
- **`Providers` 이중 역할:** `src/commons/layout/providers.tsx`는 Provider 래핑 외에 익명 유저의 작성 횟수(`getUserRouteWriteCount` + `getUserTrackWriteCount`)를 병렬 집계한다. 익명 유저 관련 UI 게이팅 이슈 발생 시 이 컴포넌트를 먼저 확인.
- **숨긴 코스·트랙(`is_hidden`)은 작성자 본인에게만 보인다:** 어드민이 숨기면 RLS SELECT 정책(`not is_hidden or user_id = auth.uid()`)이 다른 사용자에게서 뺀다. 작성자는 마이페이지·상세에서 계속 보므로, 여러 사람의 글을 보여 주는 목록 쿼리를 새로 만들면 `.eq('is_hidden', false)`를 직접 넣는다(홈 지도 `getHome*ByViewport`처럼).
- **routes·tracks UPDATE는 컬럼 단위로만 허용한다:** 작성자가 REST로 `is_hidden`을 풀지 못하게 `authenticated`에 `title, description, image_urls, updated_at`만 grant했다. 수정 화면에서 바꾸는 컬럼을 늘리면 마이그레이션으로 grant도 추가해야 한다(안 하면 `permission denied`).
