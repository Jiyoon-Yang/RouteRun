-- 어드민 코스·트랙 숨김(4단계). 어드민이 Service Role로 is_hidden을 바꾸고, 사용자 앱에서는 작성자 본인만 숨긴 글을 본다.
-- SQL Editor로 반영하므로 다시 실행해도 깨지지 않게 멱등하게 쓴다.
-- 사용자 앱이 is_hidden을 조회하므로 사용자 앱 배포 전에 반영한다.
alter table public.routes add column if not exists is_hidden boolean not null default false;
alter table public.tracks add column if not exists is_hidden boolean not null default false;

-- 기존 SELECT 정책은 그대로 두고 RESTRICTIVE 정책으로 AND를 건다. 기존 정책 이름에 기대지 않는다.
-- 작성자에게는 보인다: 마이페이지·상세에서 '숨김됨'으로 보이고, 게스트 작성 제한 집계(RLS를 탄다)에도 계속 잡힌다.
drop policy if exists "routes_hide_from_others" on public.routes;
create policy "routes_hide_from_others" on public.routes
  as restrictive for select to anon, authenticated
  using (not is_hidden or user_id = auth.uid());

drop policy if exists "tracks_hide_from_others" on public.tracks;
create policy "tracks_hide_from_others" on public.tracks
  as restrictive for select to anon, authenticated
  using (not is_hidden or user_id = auth.uid());

-- 작성자 UPDATE 정책은 컬럼을 가리지 않아서 REST로 is_hidden을 풀 수 있다.
-- 테이블 UPDATE 권한을 걷고 수정 화면이 바꾸는 컬럼만 다시 준다(updateCourse·updateTrack). 컬럼을 늘리면 여기도 늘린다.
revoke update on public.routes from anon, authenticated;
grant update (title, description, image_urls, updated_at) on public.routes to authenticated;

revoke update on public.tracks from anon, authenticated;
grant update (title, description, image_urls, updated_at) on public.tracks to authenticated;
