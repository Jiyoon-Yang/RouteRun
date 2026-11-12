# 어드민 로드맵

단계마다 `dev`에서 `feat/admin-<단계>` 브랜치를 만들고 dev PR → 리뷰 → main 순서로 간다.
마이그레이션은 루트 `supabase/migrations/` 한 곳에 두고, 운영 DB 반영은 그 단계의 main 배포 직전에 한다.

## 0. 화면 — 완료
- [x] 기능 8개 시안 A/B, 팀 리뷰, 확정
- [x] 사용자 앱과 같은 `src/` 폴더 구조

## 1. 기반: 로그인과 권한
- [x] Supabase 서버 클라이언트
- [x] Service Role 클라이언트(`server-only`, 한 파일에만) — `lib/supabase/admin.ts`. 대시보드 집계에서 먼저 사용
- [x] 이메일 로그인·로그아웃, 미로그인 접근 차단(`proxy.ts`). 사이드바 `NavUser`의 로그아웃 링크와 하드코딩 이메일도 실제 세션으로 교체
- [ ] `requireAdmin()`을 레이아웃과 모든 Server Action에서 호출 (레이아웃은 완료, Action은 만들 때마다)
- [x] 조치 기록 함수 `logAdminAction()` — `repositories/admin-log.repository.ts`. 2단계 제보 상태 변경부터 기록
- [ ] 기존 Vercel 프로젝트는 `admin/` 변경 시 빌드 건너뛰기
- [ ] Vercel 새 프로젝트(Root Directory=`admin`). 인증 없는 화면이 공개되지 않도록 위 로그인 차단과 `requireAdmin()`이 들어간 뒤에 만든다
- DB: `admins`, `admin_logs`
  - `admins`는 2026-11-10 SQL Editor로 반영. 관리자 추가: `insert into admins (user_id) values ('<auth.users id>')`
  - `admin_logs`는 2단계 마이그레이션(`20261111000000_reports_status_admin_logs.sql`)에 같이 넣었다. Service Role 전용

## 검색 유입 카드 — 단계 순서와 별개
DB 변경이 없어 단계를 기다리지 않는다. 설정 방법은 README의 "검색 유입 카드".
- [x] 대시보드 카드: Search Console 클릭·노출·클릭률·평균 순위, 인기 검색어, GA4 검색엔진별 자연 검색 방문 (`feat/admin-search-stats`)
- [ ] 콘솔 설정: Google Cloud API 2개 사용 설정, 서비스 계정 키 발급, Search Console "제한됨"·GA4 "뷰어" 권한 추가
- [ ] 어드민 Vercel 프로젝트에 환경 변수 3개. 1단계의 Vercel 새 프로젝트를 만든 뒤에 한다
- 네이버 서치어드바이저는 통계 API를 찾지 못해 콘솔 링크만 둔다. 네이버 유입은 GA4의 `naver / organic`으로 본다

## 2. 제보 처리함
- [x] 목록·상세 조회, 상태 변경, 내부 메모 저장 (`feat/admin-reports`)
- [x] 사이드바 배지·대시보드 "미처리 제보 N건"을 접수+처리중 실제 수로
- DB: `reports.status`, `admin_note`, `handled_at` — 2026-11-11 운영 DB에 SQL Editor로 반영(`admin_logs` 포함). 기존 컬럼에 기본값만 붙인 추가라 사용자 앱 배포와 순서 상관없음
- 리뷰 중 발견: `reports`에 authenticated용 `check true` INSERT 정책이 남아 있어 REST로 status·admin_note를 채워 넣을 수 있었다. `20261112000000_reports_service_role_only.sql`로 정책·권한을 걷는다(사용자 앱은 Service Role로만 insert)
- 상태를 바꿀 때만 `admin_logs`에 `update_report`를 남긴다(메모만 저장하면 기록 안 함). 메모는 기록의 사유로 같이 남는다
- 제보는 전부 받아 클라이언트에서 필터한다. 1000건에 가까워지면 페이지네이션

## 3. 공지 관리
- [x] 공지 작성·수정·삭제, 상단 고정 1개 (`feat/admin-notices`)
- [x] 사용자 앱 `/notice`를 실제 공지로 교체. 펼침 목록이고 상세 페이지는 없다
- DB: `notices` — `20261113000000_notices.sql`. 게시된 공지만 누구나 읽고(RLS), 쓰기는 Service Role만. 새 테이블이라 사용자 앱 배포와 순서 상관없음
- 고정은 초안 포함 전체 1개(partial unique index). 초안을 고정하면 게시 중인 공지의 고정이 풀린다(사용자 확정)
- 조치 기록은 초안→게시(`publish_notice`)와 삭제(`delete_notice`)만. 게시 중인 공지 수정·초안 저장은 기록 안 함
- 사용자 앱 `/notice`는 쿠키를 읽는 서버 클라이언트라 요청마다 렌더된다. 어드민은 별도 앱이라 `revalidatePath`로 캐시를 비울 수 없으니 정적 캐시를 붙이지 않는다

## 4. 코스·트랙 관리 + 이미지 검수
- [ ] 목록·검색·필터, 숨김/해제(사유 필수)
- [ ] 이미지 삭제: 스토리지 파일 + 해당 글의 `image_urls`
- [ ] 사용자 앱 홈·목록·상세·마이페이지에서 숨긴 글 제외. 쿼리마다 넣기보다 RLS SELECT 정책으로 한 번에 막는 쪽을 먼저 검토
- DB: `routes.is_hidden`, `tracks.is_hidden`

## 5. 유저 관리
- [ ] 목록·프로필·작성 활동, 정지/해제(기간·사유)
- [ ] 사용자 앱 Server Action에서 정지 유저의 작성·좋아요·제보 차단
- DB: `users.suspended_until`, `suspend_reason`

## 6. 작업 기록 + 대시보드
- [ ] 작업 기록 조회 화면 (`admin_logs`는 2단계 제보 처리부터 쌓이는 중)
- [x] 대시보드 지표 집계 (읽기 전용). KPI·신규 가입·지역별 등록·최근 등록을 DB 집계로 바꿨다 (`feat/admin-dashboard`)
  - 4단계에서 코스·트랙 KPI에 "숨김 N건 제외"와 숨김 글 제외를 다시 붙인다
  - 지역·가입 집계는 행을 받아 JS로 센다. PostgREST 1000행 제한에 가까워지면 집계 RPC로 바꾼다

## 7. 정리
- [ ] `src/commons/mocks` 삭제, 운영 배포
