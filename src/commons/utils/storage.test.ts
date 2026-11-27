import { describe, expect, it, vi } from 'vitest';

import { SUSPENDED_MESSAGE } from '@/commons/constants/messages';
import { createClient } from '@/lib/supabase/client';

import { extractCourseImagePath, uploadCourseImages } from './storage';

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

describe('uploadCourseImages 실패 문구', () => {
  function uploadFailsWith(message: string) {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      storage: {
        from: () => ({ upload: vi.fn().mockResolvedValue({ data: null, error: { message } }) }),
      },
    } as never);
  }
  const photo = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

  it('RLS 거부(정지 정책)는 정지 안내 문구로 바꾼다', async () => {
    uploadFailsWith('new row violates row-level security policy');
    await expect(uploadCourseImages([photo])).rejects.toThrow(SUSPENDED_MESSAGE);
  });

  it('다른 실패는 원래 메시지 그대로', async () => {
    uploadFailsWith('Payload too large');
    await expect(uploadCourseImages([photo])).rejects.toThrow('Payload too large');
  });
});
