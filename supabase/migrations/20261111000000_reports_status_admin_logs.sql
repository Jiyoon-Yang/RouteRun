-- 어드민 제보 처리함(2단계)과 조치 기록(1단계 남은 일).
-- SQL Editor로 반영하므로 다시 실행해도 깨지지 않게 멱등하게 쓴다.
-- reports 새 컬럼은 default가 있어서 사용자 앱의 제보 insert는 그대로 동작한다.
alter table public.reports
  add column if not exists status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  add column if not exists admin_note text not null default '',
  add column if not exists handled_at timestamptz;

-- 관리자 조치 기록. 어드민 Service Role 클라이언트만 읽고 쓴다.
-- target은 화면 표시용 문자열("제보 #1a2b3c4d → 완료")이라 작업 기록 화면이 그대로 보여준다.
create table if not exists public.admin_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_logs enable row level security;

-- 정책 없이 RLS만 켜고 기본 권한도 걷는다 → anon·authenticated는 읽기·쓰기 모두 불가.
revoke all on public.admin_logs from anon, authenticated;
