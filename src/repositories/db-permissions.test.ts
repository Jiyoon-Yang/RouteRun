import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// reports·admin_logs는 Service Role 전용이다. anon·authenticated에 권한이나 정책을 다시 열면
// 게스트가 REST로 남의 제보를 읽거나 status·admin_note를 채우고, 조치 기록을 위조할 수 있다.
// 정말 열어야 하면 이 테스트를 먼저 고치고 PR에서 이유를 설명한다.
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase/migrations');
const SERVICE_ROLE_TABLES = ['reports', 'admin_logs'];

const sql = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
  .join('\n')
  .replace(/--.*$/gm, '');

const statements = sql.split(';').map((statement) => statement.replace(/\s+/g, ' ').trim());

describe.each(SERVICE_ROLE_TABLES)('%s 테이블은 Service Role 전용', (table) => {
  const onTable = new RegExp(`\\bon (table )?(public\\.)?${table}\\b`, 'i');

  it('anon·authenticated·public에 권한을 주지 않는다', () => {
    const grants = statements.filter(
      (s) =>
        /^grant\b/i.test(s) &&
        onTable.test(s) &&
        /\b(anon|authenticated|public)\b/i.test(s.split(/ to /i)[1] ?? ''),
    );
    expect(grants).toEqual([]);
  });

  it('RLS 정책을 만들지 않는다(정책 없음 = 모든 일반 접근 거부)', () => {
    expect(statements.filter((s) => /^create policy\b/i.test(s) && onTable.test(s))).toEqual([]);
  });

  it('RLS를 끄지 않는다', () => {
    const disable = new RegExp(`alter table (public\\.)?${table} disable row level security`, 'i');
    expect(statements.filter((s) => disable.test(s))).toEqual([]);
  });

  it('기본 권한을 걷는 revoke가 남아 있다', () => {
    const revoke = new RegExp(`^revoke all on (public\\.)?${table} from anon, authenticated$`, 'i');
    expect(statements.some((s) => revoke.test(s))).toBe(true);
  });
});
