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
npx vitest               # Storybook 컴포넌트/인터랙션 테스트 (Vitest 브라우저 모드)
npm run migrate:route-paths  # path_data 마이그레이션 (일회성, .env.local 필요)
```

## 아키텍처

**스택:** Next.js 14 App Router · TypeScript · CSS Modules · Supabase (인증 + DB) · TMap Vector SDK

**데이터 흐름:**

```
Page/Component → Server Action (src/actions/) → Service (src/services/) → Repository (src/repositories/) → Supabase
```

- **Server Actions**: 인증, 코스 CRUD, 폼 제출 등 mutation 처리
- **Repositories**: Supabase를 직접 호출하는 유일한 레이어
- **Services**: Actions와 Repositories 사이의 비즈니스 로직
- **Server Components**: 데이터 패칭; Client Components (`'use client'`)는 인터랙션 상태 관리

**주요 디렉토리:**

- `src/app/` — Next.js App Router 페이지 & 레이아웃
  - `(with-map)/` — TMap이 필요한 라우트 (홈, 코스/트랙 상세·생성·수정)
  - `(no-map)/` — TMap 없이 렌더링 (로그인, 마이페이지, 신고, 공지)
- `src/actions/` — 인증, 코스, 유저 관련 Server Actions
- `src/components/` — 기능별 컴포넌트 (`home/`, `home-list/`, `courses-detail/`, `courses-submit/`, `tracks-detail/`, `tracks-submit/`, `mypage/`, `tmap/`, `report/`, `login/` 등)
- `src/commons/` — 공통 UI 컴포넌트, 훅, 상수, 프로바이더, 타입, 유틸
- `src/repositories/` — 데이터 접근 (course, user, map 레포지토리)
- `src/services/` — 비즈니스 로직 (course, user, map 서비스)
- `src/lib/supabase/` — 서버, 클라이언트, 미들웨어용 Supabase 클라이언트 설정

## 인증

`AuthProvider` (`src/commons/providers/auth/`)가 세 가지 플래그를 제공합니다:

- `isLoggedIn` — 세션 존재 여부 (게스트/익명 포함)
- `isAuthenticated` — 실제 OAuth 로그인 유저 (익명 아님)
- `isAnonymous` — 게스트 세션

미들웨어 (`middleware.ts`)는 모든 요청에서 세션을 갱신하고 비공개 라우트를 보호합니다. 세션이 없는 경우(완전 미로그인)만 차단하고 `/login`으로 리다이렉트합니다. 익명(게스트) 세션은 라우트를 통과하나, 코스 생성·수정·좋아요 등 mutation은 Action 레벨에서 `isAnonymous` 여부로 별도 차단됩니다.

**비공개 라우트:** `/courses/new`, `/courses/[id]/edit`, `/tracks/new`, `/tracks/[id]/edit`, `/mypage`

## DB 스키마 (Supabase Postgres)

- `users`: `id, nickname, profile_image_url, is_anonymous`
- `routes`: `id, user_id, title, description, distance_meters, path_data (JSON), is_round_trip (boolean), start_lat, start_lng, start_address_region, image_urls, likes_count, created_at, updated_at`
- `route_likes`: 복합키 `(user_id, route_id)`
- `tracks`: `id, user_id, title, description, distance_meters, start_lat, start_lng, start_address_region, image_urls, likes_count, created_at` (routes와 달리 `path_data` 없음)
- `track_likes`: 복합키 `(user_id, track_id)`
- 스토리지 버킷: `course_images` (공개)

## 환경 변수

`.env.local`에 필수 설정:

```
NEXT_PUBLIC_TMAP_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REPORT_EDGE_FUNCTION_URL=        # 선택. 제보 접수 시 이메일 발송용 Edge Function URL
```

## 코딩 컨벤션

- **스타일:** 컴포넌트별 CSS Modules; 인라인 스타일 금지. 색상·타이포그래피 등 상수는 `src/commons/constants/`에 위치.
- **경로 별칭:** `@/*` → `src/*`
- **컴포넌트:** 스토리 (`.stories.tsx`), 스타일 (`.module.css`), 컴포넌트 전용 훅을 같은 디렉토리에 위치.
- **`console.log` 사용 금지** (ESLint 경고); `console.error/warn/info`는 허용.
- **React Strict Mode** 비활성화 (`next.config.mjs`).
- import 순서는 ESLint로 강제: 외부 → 내부 → 상대경로.
- **SVG:** `next.config.mjs` webpack 설정으로 `.svg`를 `import`로 사용 가능 (asset/resource로 처리됨).

## Git 워크플로우

- `main` — 프로덕션 전용, 직접 커밋 금지
- `dev` — 통합 브랜치; 모든 기능은 PR + 1명 이상 승인 후 머지
- 기능 브랜치: `feat/<기능명>`

## PR 작성 규칙

PR을 생성할 때는 반드시 아래 템플릿 구조를 따릅니다.

**제목:** `[type(scope)]: 한 줄 요약` 형태 (예: `refactor(layout): 루트 레이아웃 단일화`)

**본문:**

```
### 📝 요약
- **무엇을**: <변경 내용 요약>
- **왜**: <변경 이유>

---

### 🔎 주요 변경 사항
- `변경 파일/영역`
  - **핵심 변경 1**
  - **핵심 변경 2**

---

### 🎯 의도 / Why
- **<의도 설명>**

---

### 🧪 테스트 / 검증
- **로컬 빌드/실행**: <결과>
- **화면 확인**: <확인 항목>

---

### ✅ 체크리스트
- [x] 토큰/변수 네이밍/사용처 **오탈자 없는지** 확인
- [x] 전역 적용 범위가 **의도한 영역만** 영향을 주는지 확인
- [x] (가능 시) 린트/타입체크 통과 확인
```

## Gotchas

- **TMap SDK 로딩:** `(with-map)/layout.tsx`에서 인라인 스크립트로 로드. `document.write` 호환을 위한 우회 로직 포함. TMap 관련 이슈 발생 시 이 레이아웃을 먼저 확인.
- **`redirect()` + try/catch 금지:** Next.js `redirect()`는 내부적으로 예외를 throw하므로 절대 try 블록 안에서 호출하지 않는다 (actions에서).
- **익명 세션 vs 미로그인:** 미들웨어는 세션 없는 경우만 차단. 익명 세션은 통과하지만 mutation은 Action 레벨에서 `isAnonymous`로 차단.
