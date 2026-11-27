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
- [x] `requireAdmin()`을 레이아웃과 모든 Server Action에서 호출. Action은 `require-admin-guard.test.ts`가 첫 문장인지 검사한다
- [x] 조치 기록 함수 `logAdminAction()` — `repositories/admin-log.repository.ts`. 2단계 제보 상태 변경부터 기록
- [x] 기존 Vercel 프로젝트는 `admin/` 변경 시 빌드 건너뛰기 — 2026-11-26 #64(어드민만 변경)에서 routerun이 "Canceled by Ignored Build Step"으로 확인
- [x] Vercel 새 프로젝트(Root Directory=`admin`) — 운영 주소 https://admin-yangjis-projects.vercel.app (배포 보호는 2026-11-12에 끔, 로그인 차단·`requireAdmin()`으로 막는다)
- DB: `admins`, `admin_logs`
  - `admins`는 2026-11-10 SQL Editor로 반영. 관리자 추가: `insert into admins (user_id) values ('<auth.users id>')`
  - `admin_logs`는 2단계 마이그레이션(`20261111000000_reports_status_admin_logs.sql`)에 같이 넣었다. Service Role 전용

## 검색 유입 카드 — 단계 순서와 별개
DB 변경이 없어 단계를 기다리지 않는다. 설정 방법은 README의 "검색 유입 카드".
- [x] 대시보드 카드: Search Console 클릭·노출·클릭률·평균 순위, 인기 검색어, GA4 검색엔진별 자연 검색 방문 (`feat/admin-search-stats`)
- [x] 가입 경로 카드: 사용자 앱이 가입 직후 GA `sign_up`(method google·guest)을 보내고, 어드민이 처음 들어온 소스 × 방식으로 센다. 지역별 등록은 최근 등록 옆으로 옮김 (`feat/admin-signup-channels`)
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
- 게시물 신고(`type='content'`, `target_type`·`target_id`)가 같은 처리함에 쌓인다. 상세에 대상 글 링크, 숨김은 코스·트랙 관리에서 — `20261126000000_reports_content_target.sql`
- 신고자가 탈퇴하면 `user_id`가 null(FK SET NULL)이라 "탈퇴한 사용자"로 보인다

## 3. 공지 관리
- [x] 공지 작성·수정·삭제, 상단 고정 1개 (`feat/admin-notices`)
- [x] 사용자 앱 `/notice`를 실제 공지로 교체. 펼침 목록이고 상세 페이지는 없다
- DB: `notices` — `20261113000000_notices.sql`. 게시된 공지만 누구나 읽고(RLS), 쓰기는 Service Role만. 새 테이블이라 사용자 앱 배포와 순서 상관없음
- 고정은 초안 포함 전체 1개(partial unique index). 초안을 고정하면 게시 중인 공지의 고정이 풀린다(사용자 확정)
- 조치 기록은 초안→게시(`publish_notice`)와 삭제(`delete_notice`)만. 게시 중인 공지 수정·초안 저장은 기록 안 함
- 사용자 앱 `/notice`는 쿠키를 읽는 서버 클라이언트라 요청마다 렌더된다. 어드민은 별도 앱이라 `revalidatePath`로 캐시를 비울 수 없으니 정적 캐시를 붙이지 않는다

## 4. 코스·트랙 관리 + 이미지 검수
- [x] 목록·검색·필터, 숨김/해제. 숨김만 사유 필수, 해제는 사유 없이 (`feat/admin-content`)
- [x] 사용자 앱에서 숨긴 글 제외. RLS SELECT 정책 `not is_hidden or user_id = auth.uid()`로 한 번에 막는다
  - 작성자 본인에게는 보인다(사용자 확정). 게스트 작성 제한 집계가 RLS를 타서, 완전히 숨기면 제한이 풀리기 때문이다. 마이페이지 카드 제목 앞 빨간 `숨김` 배지, 상세 안내 문구
  - 그래서 홈 지도 쿼리 2곳은 `is_hidden=false`를 직접 건다
  - 작성자가 REST로 `is_hidden`을 풀지 못하게 routes·tracks UPDATE를 컬럼 단위 grant로 좁혔다
- [x] 대시보드 코스·트랙 수·지역·최근 등록에서 숨긴 글 제외, KPI "숨김 N건 제외". 숨김/해제 Action이 `updateTag`로 10분 캐시를 비운다
- [x] 이미지 검수: 코스·트랙 사진 갤러리, 삭제(스토리지 파일 + 해당 글의 `image_urls`). 되돌릴 수 없어서 다른 PR로 뗐다 (`feat/admin-images`)
  - 사유 필수(숨김과 같은 `ReasonDialog`), 글마다 `delete_image` 기록
  - 글에 실제로 있는 URL만 지운다. 액션을 직접 불러도 글에 안 걸린 파일은 못 지운다
  - 우리 Supabase 호스트의 `course_images` URL이면 작성자 폴더 밖이어도 파일을 지운다. 다른 호스트의 URL은 우리 버킷에 파일이 없어 글에서만 뺀다
  - 다른 코스·트랙(또는 이 글의 남은 사진)이 같은 파일을 쓰면 파일은 남기고 이 글에서만 뺀다. 마지막 참조를 지울 때 파일도 지운다(작성자가 REST로 남의 URL을 넣은 경우). 쿼리스트링·인코딩만 바꾼 URL도 있어 URL이 아니라 버킷 경로로 비교한다
  - 스토리지를 먼저 지우고 `image_urls`를 고친다. DB 갱신이 실패해도 URL이 남아 다시 누르면 다시 시도된다
  - 20장씩 페이지로 본다. 사진은 `image_urls` 배열 안에 있어 DB에서 장 단위로 못 자르니, 사진 있는 글을 전부 받아 서버에서 자른다. 사진 있는 글이 1000개에 가까워지면 배열을 펼친 view로 바꾼다
  - 업로드 시각이 없어 글 등록 시각 순이다
  - 페이지 이동은 코스·트랙 관리와 같은 공용 `PageNav`(번호 전부 나열)
- DB: `routes.is_hidden`, `tracks.is_hidden` — `20261114000000_content_hidden.sql`. 컬럼이 없으면 사용자 앱 조회가 깨지니 **이 브랜치 배포 전에 반영**
- 목록은 서버에서 필터해 20개씩 받는다(`feat/admin-content-pagination`). 지역 필터는 권역 7개 고정 목록(`REGION_GROUPS`: 서울·경기·인천·강원·충청·전라·경상·제주)이고, 시·도 이름으로 시작하는지로 거른다(`feat/admin-region-groups`). 광주는 `광주광역시`·`전라남도`·`전남광주통합특별시`가 섞여 있어 전라로 묶었다. 경로 미리보기는 `path_data` 파서를 옮겨야 해서 뺐다

## 5. 유저 관리
- [x] 목록·검색·구글/게스트 필터, 프로필(이메일·최근 로그인·활동 수), 최근 작성글·제보 10개 (`feat/admin-users`, DB 변경 없음)
  - 목록은 20명씩 서버에서 받는다. 좁은 열이라 번호 대신 이전·다음만 둔다
  - 이메일·최근 로그인은 `users`에 없어 Auth Admin API(`getUserById`)로 고른 유저만 읽는다. 그래서 이메일 검색은 없다
- [x] 정지/해제(7일·30일·영구, 사유 필수), `suspend_user`·`unsuspend_user` 기록. 목록·프로필에 `정지` 배지 (`feat/admin-suspend`)
  - 끝나는 시각은 서버 시계로 정한다. 끝난 정지 행은 남겨 두고 조회에서만 뺀다(다시 정지하면 덮어쓴다)
  - 해제는 사유 없이, 실제로 지운 정지가 있을 때만 기록한다
- [x] 사용자 앱에서 정지 유저의 코스·트랙 작성·수정, 좋아요(누르기·취소), 제보 차단. 삭제·조회·로그인·탈퇴는 그대로(사용자 확정)
  - Server Action이 세션 확인 직후 `is_current_user_suspended()`로 막고 안내한다. 확인이 실패해도 막는다(게스트 한도와 같은 규칙)
  - routes·tracks INSERT/UPDATE, 좋아요 INSERT/DELETE에 RESTRICTIVE RLS 정책을 더해 REST 직접 호출도 막는다. 제보는 Service Role insert라 Action에서만 막는다
  - 좋아요가 정지로 막히면 공용 훅이 정지 안내 문구를 띄운다(다른 실패는 "좋아요 처리에 실패했습니다")
  - `course_images` 업로드도 RESTRICTIVE 정책으로 막는다(`20261128000000_suspended_upload_block.sql`). 앱은 항상 본인 폴더에 올리므로 이 버킷의 RLS 거부는 정지뿐이라, `storage.ts`가 그 거부를 정지 안내로 바꾼다. 글에 붙지 않는 파일이 남지 않는다
  - 업로드 INSERT 정책이 버킷만 봐서 남의 폴더에도 올릴 수 있던 것을 본인 폴더만으로 좁혔다(`20261129000000_course_images_own_folder_upload.sql`, RESTRICTIVE)
- DB: `user_suspensions(user_id, until, reason)` Service Role 전용 — `20261127000000_user_suspensions.sql`. `users`는 닉네임 수정으로 본인 UPDATE가 열려 있어 컬럼을 두면 정지를 스스로 풀 수 있다(사용자 확정). 사용자 앱 Action이 함수를 부르므로 **사용자 앱 배포 전에 반영**(없으면 작성·좋아요·제보가 모두 막힌다)

## 6. 작업 기록 + 대시보드
- [x] 작업 기록 조회 화면 (`feat/admin-audit`, DB 변경 없음)
  - 기간(24시간·7일·30일·전체)·작업 종류·관리자 필터, 대상·사유 검색을 서버에서 걸고 50건씩 `PageNav`로 본다
  - 관리자 이메일은 `admins` 명단 + 기록에 남은 id를 Auth Admin API로 한 명씩 읽는다(몇 명뿐). 못 읽으면 id 앞 8자, 계정이 지워져 `admin_id`가 null이면 "삭제된 관리자"
  - 검색어는 `or` 조건을 큰따옴표로 감싸 쉼표·괄호가 문법을 깨지 않게 한다(`ilikeAny`, 테스트 있음)
  - 시안의 CSV 내보내기는 뺐다
- [x] 대시보드 지표 집계 (읽기 전용). KPI·신규 가입·지역별 등록·최근 등록을 DB 집계로 바꿨다 (`feat/admin-dashboard`)
  - 코스·트랙 KPI의 "숨김 N건 제외"와 숨김 글 제외는 4단계에서 붙였다
  - 지역·가입 집계는 행을 받아 JS로 센다. PostgREST 1000행 제한에 가까워지면 집계 RPC로 바꾼다

## 7. 정리
- [x] `src/commons/mocks` 삭제 (작업 기록이 마지막 사용처였다. `formatRelative`의 `now`는 필수 인자로)
- [x] 운영 배포 — 2026-11-26 #64로 0~7단계 전부 운영 반영
