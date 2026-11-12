-- 제보 insert는 사용자 앱 submitReportAction이 Service Role로만 한다(검증·10분 3건 제한·메일 발송이 거기 있다).
-- 그런데 authenticated(게스트 포함)에게 `check true` INSERT 정책과 테이블 권한이 남아 있었다.
-- 그래서 REST로 직접 넣으면 남의 user_id나, 어드민 컬럼(status·admin_note·handled_at)을 마음대로 채울 수 있었다.
-- 앱이 쓰지 않는 경로라 정책과 권한을 걷는다. Service Role은 RLS·권한과 무관하게 계속 동작한다.
-- SQL Editor로 반영하므로 다시 실행해도 깨지지 않게 쓴다.
drop policy if exists "세션 보유 사용자 제보 가능" on public.reports;

revoke all on public.reports from anon, authenticated;
