import { describe, expect, it, vi } from 'vitest';

import { removeUserImageFolder } from './storage.repository';

import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

/** list가 pages를 차례로 돌려주고, remove는 removeAll이면 전부·아니면 0개 지웠다고 응답하는 가짜 클라이언트 */
function fakeClient(pages: string[][], removeAll = true) {
  const list = vi.fn();
  pages.forEach((names) =>
    list.mockResolvedValueOnce({ data: names.map((name) => ({ name })), error: null }),
  );
  list.mockResolvedValue({ data: [], error: null });
  const remove = vi.fn(async (paths: string[]) => ({ data: removeAll ? paths : [], error: null }));
  const client = { storage: { from: () => ({ list, remove }) } } as unknown as SupabaseClient;
  return { client, list, remove };
}

describe('removeUserImageFolder', () => {
  it('목록이 빌 때까지 사용자 폴더 파일을 지운다', async () => {
    const { client, remove } = fakeClient([['a.jpg', 'b.png'], ['c.webp']]);
    await removeUserImageFolder(client, 'user-1');
    expect(remove).toHaveBeenNthCalledWith(1, ['user-1/a.jpg', 'user-1/b.png']);
    expect(remove).toHaveBeenNthCalledWith(2, ['user-1/c.webp']);
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it('하나도 안 지워지면 무한 반복하지 않고 멈춘다', async () => {
    const { client, list } = fakeClient([['a.jpg'], ['a.jpg'], ['a.jpg']], false);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await removeUserImageFolder(client, 'user-1');
    expect(list).toHaveBeenCalledTimes(1);
  });
});
