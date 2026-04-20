-- Supabase SQL Editor에서 이 스크립트를 실행하세요.
-- CourseList, CoursePoints 테이블에 anon 사용자 접근 허용

-- 1. CourseList - 기존 정책 제거 후 개별 정책 생성
DROP POLICY IF EXISTS "Allow anon all CourseList" ON "CourseList";
DROP POLICY IF EXISTS "Allow anon select CourseList" ON "CourseList";
DROP POLICY IF EXISTS "Allow anon insert CourseList" ON "CourseList";
DROP POLICY IF EXISTS "Allow anon update CourseList" ON "CourseList";
DROP POLICY IF EXISTS "Allow anon delete CourseList" ON "CourseList";

CREATE POLICY "Allow anon select CourseList" ON "CourseList" FOR SELECT USING (true);
CREATE POLICY "Allow anon insert CourseList" ON "CourseList" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update CourseList" ON "CourseList" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete CourseList" ON "CourseList" FOR DELETE USING (true);

-- 2. CoursePoints - 기존 정책 제거 후 개별 정책 생성
DROP POLICY IF EXISTS "Allow anon all CoursePoints" ON "CoursePoints";
DROP POLICY IF EXISTS "Allow anon select CoursePoints" ON "CoursePoints";
DROP POLICY IF EXISTS "Allow anon insert CoursePoints" ON "CoursePoints";
DROP POLICY IF EXISTS "Allow anon update CoursePoints" ON "CoursePoints";
DROP POLICY IF EXISTS "Allow anon delete CoursePoints" ON "CoursePoints";

CREATE POLICY "Allow anon select CoursePoints" ON "CoursePoints" FOR SELECT USING (true);
CREATE POLICY "Allow anon insert CoursePoints" ON "CoursePoints" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update CoursePoints" ON "CoursePoints" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete CoursePoints" ON "CoursePoints" FOR DELETE USING (true);
