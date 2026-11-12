-- 어드민 공지 관리(3단계). 어드민이 Service Role로 쓰고, 사용자 앱 /notice가 게시된 공지만 읽는다.
-- SQL Editor로 반영하므로 다시 실행해도 깨지지 않게 멱등하게 쓴다.
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 60),
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 상단 고정은 초안 포함 전체에서 1개. 어드민이 기존 고정을 먼저 풀고 저장하고, 놓치면 여기서 막힌다.
create unique index if not exists notices_one_pinned on public.notices (pinned) where pinned;

alter table public.notices enable row level security;

-- 초안은 숨기고 게시된 공지만 누구나 읽는다. 쓰기 정책은 없다 → 어드민 Service Role만 쓸 수 있다.
drop policy if exists "notices_select_published" on public.notices;
create policy "notices_select_published" on public.notices
  for select to anon, authenticated
  using (status = 'published');

-- Supabase가 public 새 테이블에 주는 기본 ALL 권한을 걷고 조회만 남긴다 (RLS와 별개로 한 겹 더).
revoke all on public.notices from anon, authenticated;
grant select on public.notices to anon, authenticated;
