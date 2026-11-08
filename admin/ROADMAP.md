# 어드민 로드맵

단계마다 `dev`에서 `feat/admin-<단계>` 브랜치를 만들고 dev PR → 리뷰 → main 순서로 간다.
마이그레이션은 루트 `supabase/migrations/` 한 곳에 두고, 운영 DB 반영은 그 단계의 main 배포 직전에 한다.

## 0. 화면 — 완료
- [x] 기능 8개 시안 A/B, 팀 리뷰, 확정
- [x] 사용자 앱과 같은 `src/` 폴더 구조

## 1. 기반: 로그인과 권한
- [ ] Supabase 클라이언트: 서버용, Service Role용(`server-only`, 한 파일에만)
- [ ] 이메일 로그인·로그아웃, 미로그인 접근 차단(`proxy.ts`). 사이드바 `NavUser`의 로그아웃 링크와 하드코딩 이메일도 실제 세션으로 교체
- [ ] `requireAdmin()`을 레이아웃과 모든 Server Action에서 호출
- [ ] 조치 기록 함수 `logAdminAction()`. 2단계부터 모든 조치가 기록되도록 지금 만든다
- [ ] 기존 Vercel 프로젝트는 `admin/` 변경 시 빌드 건너뛰기
- [ ] Vercel 새 프로젝트(Root Directory=`admin`). 인증 없는 화면이 공개되지 않도록 위 로그인 차단과 `requireAdmin()`이 들어간 뒤에 만든다
- DB: `admins`, `admin_logs`

## 2. 제보 처리함
- [ ] 목록·상세 조회, 상태 변경, 내부 메모 저장
- DB: `reports.status`, `admin_note`, `handled_at`

## 3. 공지 관리
- [ ] 공지 작성·수정·삭제, 상단 고정 1개
- [ ] 사용자 앱 `/notice`를 실제 공지로 교체
- DB: `notices` (누구나 읽기)

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
- [ ] 작업 기록 조회 화면 (`admin_logs`는 1단계부터 쌓이는 중)
- [ ] 대시보드 지표 집계 (읽기 전용)

## 7. 정리
- [ ] `src/commons/mocks` 삭제, 운영 배포
