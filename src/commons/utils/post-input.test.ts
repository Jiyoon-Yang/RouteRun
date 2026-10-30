import { describe, expect, it, vi } from 'vitest';

import { MAX_POST_IMAGES, MAX_POST_TITLE_LENGTH, validatePostInput } from './post-input';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');

const USER = 'user-1';
const OWN_IMAGE = `https://abc.supabase.co/storage/v1/object/public/course_images/${USER}/a.jpg`;

describe('validatePostInput', () => {
  it('제목·설명을 trim하고 빈 설명은 null로 바꾼다', () => {
    expect(
      validatePostInput({ title: '  한강 코스 ', description: '   ', imageUrls: [], userId: USER }),
    ).toEqual({
      data: { title: '한강 코스', description: null, imageUrls: [] },
      error: null,
    });
  });

  it('공백뿐인 제목과 너무 긴 제목을 거절한다', () => {
    expect(validatePostInput({ title: '   ', imageUrls: [], userId: USER }).error).toBe(
      '제목을 입력해 주세요.',
    );
    expect(
      validatePostInput({
        title: 'a'.repeat(MAX_POST_TITLE_LENGTH + 1),
        imageUrls: [],
        userId: USER,
      }).error,
    ).not.toBeNull();
  });

  it('이미지 목록 형식과 장수를 검사한다', () => {
    expect(validatePostInput({ title: 't', imageUrls: [1], userId: USER }).error).not.toBeNull();
    expect(validatePostInput({ title: 't', imageUrls: 'x', userId: USER }).error).not.toBeNull();
    expect(
      validatePostInput({
        title: 't',
        imageUrls: Array(MAX_POST_IMAGES + 1).fill(OWN_IMAGE),
        userId: USER,
      }).error,
    ).not.toBeNull();
  });

  it('본인 Storage 폴더의 이미지만 허용한다', () => {
    expect(
      validatePostInput({ title: 't', imageUrls: [OWN_IMAGE], userId: USER }).error,
    ).toBeNull();
    for (const url of [
      'https://evil.example/storage/v1/object/public/course_images/user-1/a.jpg',
      'https://abc.supabase.co/storage/v1/object/public/course_images/user-2/a.jpg',
      'https://abc.supabase.co/storage/v1/object/public/course_images/user-1/../user-2/a.jpg',
    ]) {
      expect(
        validatePostInput({ title: 't', imageUrls: [url], userId: USER }).error,
      ).not.toBeNull();
    }
  });
});
