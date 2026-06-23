-- routes/tracks의 likes_count를 route_likes/track_likes 변경에 맞춰 DB 트리거로 동기화한다.
-- 배경: 기존에는 애플리케이션 코드가 likes_count를 직접 UPDATE했는데,
-- routes/tracks의 RLS 정책("Users can update/delete own routes" 등)이 작성자 본인만
-- UPDATE를 허용하다 보니, 작성자가 아닌 다른 사용자가 좋아요를 눌러도 likes_count가
-- 갱신되지 않는 문제가 있었다. 트리거는 SECURITY DEFINER로 실행되어 RLS와 무관하게
-- 동작하므로, 누가 좋아요를 누르든 항상 정확히 카운트된다.

-- 기존에 누락되었을 수 있는 카운트를 실제 좋아요 행 기준으로 보정한다.
update routes r
set likes_count = (select count(*) from route_likes rl where rl.route_id = r.id);

update tracks t
set likes_count = (select count(*) from track_likes tl where tl.track_id = t.id);

create or replace function public.sync_route_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update routes set likes_count = likes_count + 1 where id = new.route_id;
  elsif tg_op = 'DELETE' then
    update routes set likes_count = greatest(likes_count - 1, 0) where id = old.route_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_route_likes_count on route_likes;
create trigger trg_sync_route_likes_count
after insert or delete on route_likes
for each row execute function public.sync_route_likes_count();

create or replace function public.sync_track_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update tracks set likes_count = likes_count + 1 where id = new.track_id;
  elsif tg_op = 'DELETE' then
    update tracks set likes_count = greatest(likes_count - 1, 0) where id = old.track_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_track_likes_count on track_likes;
create trigger trg_sync_track_likes_count
after insert or delete on track_likes
for each row execute function public.sync_track_likes_count();
