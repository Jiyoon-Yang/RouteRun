import fs from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { updateCourse } from './course/course.repository';
import { getHomeRoutesByViewport } from './course/home.repository';
import { getHomeTracksByViewport } from './track/home.repository';
import { updateTrack } from './track/track.repository';

// 숨긴 글·컬럼 단위 UPDATE 권한을 앱 코드가 지키는지 본다.
// 한계: RLS·grant 자체는 실제 Postgres가 있어야 검증된다. 여기서는 쿼리 모양과 마이그레이션 문자열만 본다.
vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

type Call = [method: string, ...args: unknown[]];

/** 체이닝 호출을 기록하고, await하면 `result`를 돌려주는 가짜 쿼리 빌더 */
function recordQuery(result: { data: unknown; error: unknown }) {
  const calls: Call[] = [];
  const builder: unknown = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') return (resolve: (value: unknown) => void) => resolve(result);
        return (...args: unknown[]) => {
          calls.push([String(prop), ...args]);
          return builder;
        };
      },
    },
  );
  return { client: builder as never, calls };
}

const VIEWPORT = { northEastLat: 37.6, northEastLng: 127.1, southWestLat: 37.5, southWestLng: 127 };

describe('홈 지도는 숨긴 글을 직접 뺀다 (RLS는 작성자 본인에게 숨긴 글을 내려준다)', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['routes', () => getHomeRoutesByViewport(VIEWPORT)],
    ['tracks', () => getHomeTracksByViewport(VIEWPORT)],
  ])('%s 뷰포트 조회에 is_hidden = false 조건이 있다', async (table, fetchHome) => {
    const query = recordQuery({ data: [], error: null });
    vi.mocked(createClient).mockReturnValue(query.client);

    await fetchHome();

    expect(query.calls).toContainEqual(['from', table]);
    expect(query.calls).toContainEqual(['eq', 'is_hidden', false]);
  });
});

// 마이그레이션의 마지막 `grant update (...) on public.<table> to authenticated` 컬럼 목록
function grantedUpdateColumns(table: string): string[] {
  const dir = path.join(process.cwd(), 'supabase/migrations');
  const sql = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => fs.readFileSync(path.join(dir, file), 'utf8'))
    .join('\n')
    .replace(/--.*$/gm, '');
  const grants = Array.from(
    sql.matchAll(
      new RegExp(
        `grant\\s+update\\s*\\(([^)]*)\\)\\s+on\\s+(?:table\\s+)?(?:public\\.)?${table}\\s+to\\s+authenticated`,
        'gi',
      ),
    ),
  );
  const columns = grants[grants.length - 1]?.[1] ?? '';
  return columns
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
}

describe('작성자 수정은 grant된 컬럼만 보낸다 (is_hidden을 풀지 못하게 컬럼 단위로만 열어 뒀다)', () => {
  const params = { userId: 'u1', title: '제목', description: null, image_urls: [] };

  it.each([
    ['routes', (client: never) => updateCourse(client, { ...params, courseId: 'c1' })],
    ['tracks', (client: never) => updateTrack(client, { ...params, trackId: 't1' })],
  ])('%s UPDATE payload ⊆ 마이그레이션 grant 컬럼', async (table, update) => {
    const granted = grantedUpdateColumns(table);
    expect(granted).not.toContain('is_hidden');
    expect(granted.length).toBeGreaterThan(0);

    const query = recordQuery({ data: null, error: { message: 'stop' } });
    await update(query.client);

    expect(query.calls).toContainEqual(['from', table]);
    const payload = query.calls.find(([method]) => method === 'update')?.[1] as Record<
      string,
      unknown
    >;
    // 실패하면 grant 밖 컬럼 이름이 그대로 보인다. 정말 필요하면 마이그레이션으로 grant를 먼저 추가한다.
    expect(Object.keys(payload).filter((column) => !granted.includes(column))).toEqual([]);
    // 작성자 본인 행만 수정
    expect(query.calls).toContainEqual(['eq', 'user_id', 'u1']);
  });
});
