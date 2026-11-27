-- 정지된 유저는 코스·트랙 사진(course_images)도 올리지 못한다. 글 저장은 이미 막혀 있어서, 업로드만 되면 글에 붙지 않는 파일이 남는다.
-- SQL Editor로 반영하므로 다시 실행해도 깨지지 않게 멱등하게 쓴다.
-- 20261127000000_user_suspensions.sql의 is_current_user_suspended()가 먼저 있어야 한다.

-- 기존 업로드 정책("course_images 로그인 유저만 업로드 가능", bucket만 확인)은 그대로 두고 AND를 건다.
-- 다른 버킷은 건드리지 않는다. 사용자 앱(storage.ts)은 이 버킷의 RLS 거부를 정지 안내 문구로 바꿔 보여 준다.
drop policy if exists "course_images_block_suspended_upload" on storage.objects;
create policy "course_images_block_suspended_upload" on storage.objects
  as restrictive for insert to authenticated
  with check (bucket_id <> 'course_images' or not public.is_current_user_suspended());
