-- 게시물 신고(정보통신망법 권리침해 신고 창구): reports에 'content' 유형과 신고 대상(코스·트랙)을 더한다.
-- 사용자 앱 submitReportAction이 Service Role로 넣고, 어드민 제보 처리함이 대상 링크와 함께 보여준다.
-- SQL Editor로 반영하므로 다시 실행해도 깨지지 않게 멱등하게 쓴다.

alter table public.reports
  add column if not exists target_type text,
  add column if not exists target_id uuid;

-- type 컬럼의 기존 check 제약 이름을 레포가 모르므로(초기 테이블은 대시보드에서 만듦) 'bug' 값이 든 제약을 찾아서 지운 뒤 다시 건다
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname from pg_constraint
    where conrelid = 'public.reports'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%''bug''%'
      and pg_get_constraintdef(oid) not ilike '%target%'
  loop
    execute format('alter table public.reports drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.reports
  add constraint reports_type_check
    check (type in ('bug', 'inconvenience', 'suggestion', 'content'));

-- 게시물 신고만 대상이 있고, 대상이 있으면 코스(route) 또는 트랙(track)이다
alter table public.reports drop constraint if exists reports_content_target_check;
alter table public.reports
  add constraint reports_content_target_check
    check (
      (type = 'content' and target_type in ('route', 'track') and target_id is not null)
      or (type <> 'content' and target_type is null and target_id is null)
    );
