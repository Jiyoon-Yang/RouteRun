-- 어드민 앱(admin/) 관리자 명단. 이메일 로그인에 성공해도 여기 없으면 어드민에 들어갈 수 없다.
-- users row는 사용자 앱 auth/callback에서만 생기므로 auth.users를 참조한다.
-- 관리자 등록은 환경마다 id가 달라 SQL Editor에서 직접 insert한다.
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- 본인 행만 조회 가능 → 관리자 여부 확인에 Service Role이 필요 없고, 명단은 노출되지 않는다.
create policy "admins_select_self" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

grant select on public.admins to authenticated;
