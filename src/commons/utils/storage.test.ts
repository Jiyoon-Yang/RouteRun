import { describe, expect, it, vi } from 'vitest';

import { extractCourseImagePath } from './storage';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

const BASE = 'https://abc.supabase.co/storage/v1/object/public/course_images';

describe('extractCourseImagePath', () => {
  it('본인 폴더의 public URL을 버킷 경로로 바꾼다', () => {
    expect(extractCourseImagePath(`${BASE}/user-1/uuid-photo.jpg`, 'user-1')).toBe(
      'user-1/uuid-photo.jpg',
    );
  });

  it('남의 폴더·다른 버킷·상위 경로는 null', () => {
    expect(extractCourseImagePath(`${BASE}/user-2/uuid-photo.jpg`, 'user-1')).toBeNull();
    expect(
      extractCourseImagePath(
        'https://abc.supabase.co/storage/v1/object/public/other/user-1/a.jpg',
        'user-1',
      ),
    ).toBeNull();
    expect(extractCourseImagePath(`${BASE}/user-1/../user-2/a.jpg`, 'user-1')).toBeNull();
    expect(extractCourseImagePath('https://evil.example/user-1/a.jpg', 'user-1')).toBeNull();
  });
});
