import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getUserRouteWriteCount } from '@/services/course/courseService';
import { getUserTrackWriteCount } from '@/services/track/trackService';

import { isGuestWriteLimitReached } from './userService';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/repositories/user.repository', () => ({}));
vi.mock('@/services/course/courseService', () => ({ getUserRouteWriteCount: vi.fn() }));
vi.mock('@/services/track/trackService', () => ({ getUserTrackWriteCount: vi.fn() }));

function mockCounts(courseCount: number | null, trackCount: number | null) {
  vi.mocked(getUserRouteWriteCount).mockResolvedValue({
    count: courseCount,
    error: courseCount === null ? new Error('db') : null,
  });
  vi.mocked(getUserTrackWriteCount).mockResolvedValue({
    count: trackCount,
    error: trackCount === null ? new Error('db') : null,
  });
}

describe('isGuestWriteLimitReached', () => {
  beforeEach(() => vi.clearAllMocks());

  it('아무것도 안 썼으면 통과', async () => {
    mockCounts(0, 0);
    expect(await isGuestWriteLimitReached('u1')).toBe(false);
  });

  it('트랙만 1개 써도 코스·트랙 합산으로 막힌다', async () => {
    mockCounts(0, 1);
    expect(await isGuestWriteLimitReached('u1')).toBe(true);
  });

  it('집계에 실패하면 막는다', async () => {
    mockCounts(0, null);
    expect(await isGuestWriteLimitReached('u1')).toBe(true);
  });
});
