import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// reports·admin_logs·user_suspensions는 Service Role 전용이다. anon·authenticated에 권한이나 정책을 다시 열면
// 게스트가 REST로 남의 제보를 읽거나 status·admin_note를 채우고, 조치 기록을 위조할 수 있다.
// 정말 열어야 하면 이 테스트를 먼저 고치고 PR에서 이유를 설명한다.
// 한계: 마이그레이션 SQL 문자열만 본다. SQL Editor로 직접 바꾼 운영 DB 권한이나 동적 SQL(execute)은 못 잡는다.
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase/migrations');
const SERVICE_ROLE_TABLES = ['reports', 'admin_logs', 'user_suspensions'];

const sql = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
  .join('\n')
  .replace(/--.*$/gm, '');

const statements = sql.split(';').map((statement) => statement.replace(/\s+/g, ' ').trim());
const toGeneralRoles = (s: string) =>
  /\b(anon|authenticated|public)\b/i.test(s.split(/ to /i)[1] ?? '');

it('스키마 전체·기본 권한으로 anon·authenticated에 테이블 권한을 주지 않는다(reports·admin_logs가 같이 열린다)', () => {
  const broadGrants = statements.filter(
    (s) =>
      (/^grant\b.* on all tables in schema public\b/i.test(s) ||
        /^alter default privileges\b.* grant\b.* on tables\b/i.test(s)) &&
      toGeneralRoles(s),
  );
  expect(broadGrants).toEqual([]);
});

describe.each(SERVICE_ROLE_TABLES)('%s 테이블은 Service Role 전용', (table) => {
  const onTable = new RegExp(`\\bon (table )?(public\\.)?${table}\\b`, 'i');

  it('anon·authenticated·public에 권한을 주지 않는다', () => {
    expect(
      statements.filter((s) => /^grant\b/i.test(s) && onTable.test(s) && toGeneralRoles(s)),
    ).toEqual([]);
  });

  it('RLS 정책을 만들지 않는다(정책 없음 = 모든 일반 접근 거부)', () => {
    expect(statements.filter((s) => /^create policy\b/i.test(s) && onTable.test(s))).toEqual([]);
  });

  it('RLS를 끄지 않는다', () => {
    const disable = new RegExp(`alter table (public\\.)?${table} disable row level security`, 'i');
    expect(statements.filter((s) => disable.test(s))).toEqual([]);
  });

  it('기본 권한을 걷는 revoke가 남아 있다', () => {
    // 표기(table 키워드, 역할 순서)가 달라도 anon·authenticated 둘 다 걷으면 통과
    const revokes = statements.filter(
      (s) => /^revoke all\b/i.test(s) && onTable.test(s) && / from /i.test(s),
    );
    expect(revokes.some((s) => /\banon\b/i.test(s) && /\bauthenticated\b/i.test(s))).toBe(true);
  });
});
