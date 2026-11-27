-- course_images 업로드는 본인 폴더(<auth.uid()>/...)에만 허용한다.
-- 기존 업로드 정책("course_images 로그인 유저만 업로드 가능")은 bucket만 확인해서, 로그인한 누구나 남의 폴더에 파일을 올릴 수 있었다.
-- 수정·삭제 정책("자신의 이미지만 수정하거나 삭제할 수 있습니")은 이미 폴더를 본다. 업로드만 같은 조건을 맞춘다.
-- SQL Editor로 반영하므로 다시 실행해도 깨지지 않게 멱등하게 쓴다.
-- 사용자 앱(storage.ts)은 항상 `${user.id}/...`에 올리므로 정상 업로드는 영향이 없다. 어드민은 Service Role이라 RLS를 타지 않는다.

-- 기존 정책 이름(대시보드에서 만든 한글 이름)에 기대지 않도록 RESTRICTIVE 정책으로 AND를 건다. 다른 버킷은 건드리지 않는다.
drop policy if exists "course_images_own_folder_upload" on storage.objects;
create policy "course_images_own_folder_upload" on storage.objects
  as restrictive for insert to authenticated
  with check (
    bucket_id <> 'course_images'
    or (storage.foldername(name))[1] = (select auth.uid())::text
  );
