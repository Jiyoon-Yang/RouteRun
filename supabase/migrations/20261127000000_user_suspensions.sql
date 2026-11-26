-- 어드민 유저 정지(5단계). 어드민이 Service Role로 정지를 넣고 빼고, 정지 중인 유저는 코스·트랙 작성·수정, 좋아요, 제보를 못 한다.
-- 삭제·조회·로그인·탈퇴는 그대로 둔다.
-- SQL Editor로 반영하므로 다시 실행해도 깨지지 않게 멱등하게 쓴다.
-- 사용자 앱 Action이 is_current_user_suspended()를 부르므로 사용자 앱 배포 전에 반영한다(없으면 확인 실패로 작성·좋아요·제보가 모두 막힌다).

-- users 컬럼으로 두지 않는다. 닉네임 수정 때문에 users 본인 UPDATE가 열려 있어 REST로 정지를 스스로 풀 수 있다.
create table if not exists public.user_suspensions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  until timestamptz, -- null이면 영구 정지
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.user_suspensions enable row level security;

-- 정책 없이 RLS만 켜고 기본 권한도 걷는다 → anon·authenticated는 읽기·쓰기 모두 불가.
revoke all on public.user_suspensions from anon, authenticated;

-- 아래 정책과 사용자 앱 Action이 쓰는 확인 함수. 테이블을 못 읽는 일반 유저도 쓰도록 SECURITY DEFINER로 두고,
-- 인자 없이 auth.uid()만 봐서 남의 정지 여부는 물을 수 없다.
create or replace function public.is_current_user_suspended()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_suspensions
    where user_id = auth.uid() and (until is null or until > now())
  );
$$;

revoke all on function public.is_current_user_suspended() from public, anon;
grant execute on function public.is_current_user_suspended() to authenticated;

-- 기존 정책은 그대로 두고 RESTRICTIVE 정책으로 AND를 건다. 기존 정책 이름에 기대지 않는다.
-- 게스트(익명 로그인)도 authenticated 역할이다. likes_count 트리거는 SECURITY DEFINER라 이 정책을 타지 않는다.
drop policy if exists "routes_block_suspended_insert" on public.routes;
create policy "routes_block_suspended_insert" on public.routes
  as restrictive for insert to authenticated
  with check (not public.is_current_user_suspended());

drop policy if exists "routes_block_suspended_update" on public.routes;
create policy "routes_block_suspended_update" on public.routes
  as restrictive for update to authenticated
  using (not public.is_current_user_suspended());

drop policy if exists "tracks_block_suspended_insert" on public.tracks;
create policy "tracks_block_suspended_insert" on public.tracks
  as restrictive for insert to authenticated
  with check (not public.is_current_user_suspended());

drop policy if exists "tracks_block_suspended_update" on public.tracks;
create policy "tracks_block_suspended_update" on public.tracks
  as restrictive for update to authenticated
  using (not public.is_current_user_suspended());

-- 좋아요는 누르기·취소 모두 막는다(Action의 토글과 같은 규칙).
drop policy if exists "route_likes_block_suspended_insert" on public.route_likes;
create policy "route_likes_block_suspended_insert" on public.route_likes
  as restrictive for insert to authenticated
  with check (not public.is_current_user_suspended());

drop policy if exists "route_likes_block_suspended_delete" on public.route_likes;
create policy "route_likes_block_suspended_delete" on public.route_likes
  as restrictive for delete to authenticated
  using (not public.is_current_user_suspended());

drop policy if exists "track_likes_block_suspended_insert" on public.track_likes;
create policy "track_likes_block_suspended_insert" on public.track_likes
  as restrictive for insert to authenticated
  with check (not public.is_current_user_suspended());

drop policy if exists "track_likes_block_suspended_delete" on public.track_likes;
create policy "track_likes_block_suspended_delete" on public.track_likes
  as restrictive for delete to authenticated
  using (not public.is_current_user_suspended());
