import { describe, expect, it } from 'vitest';

import { MAX_POST_IMAGES, MAX_POST_TITLE_LENGTH, validatePostInput } from './post-input';

describe('validatePostInput', () => {
  it('제목·설명을 trim하고 빈 설명은 null로 바꾼다', () => {
    expect(validatePostInput({ title: '  한강 코스 ', description: '   ', imageUrls: [] })).toEqual(
      {
        data: { title: '한강 코스', description: null, imageUrls: [] },
        error: null,
      },
    );
  });

  it('공백뿐인 제목과 너무 긴 제목을 거절한다', () => {
    expect(validatePostInput({ title: '   ', imageUrls: [] }).error).toBe('제목을 입력해 주세요.');
    expect(
      validatePostInput({ title: 'a'.repeat(MAX_POST_TITLE_LENGTH + 1), imageUrls: [] }).error,
    ).not.toBeNull();
  });

  it('이미지 목록 형식과 장수를 검사한다', () => {
    expect(validatePostInput({ title: 't', imageUrls: [1] }).error).not.toBeNull();
    expect(validatePostInput({ title: 't', imageUrls: 'x' }).error).not.toBeNull();
    expect(
      validatePostInput({ title: 't', imageUrls: Array(MAX_POST_IMAGES + 1).fill('u') }).error,
    ).not.toBeNull();
  });
});
