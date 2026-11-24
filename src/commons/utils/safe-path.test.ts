import { describe, expect, it } from 'vitest';

import { isSafeRelativePath } from './safe-path';

describe('isSafeRelativePath', () => {
  it('사이트 내부 경로는 허용한다', () => {
    expect(isSafeRelativePath('/')).toBe(true);
    expect(isSafeRelativePath('/notice?tab=1')).toBe(true);
  });

  it('외부로 나갈 수 있는 값은 막는다', () => {
    for (const value of [
      '//evil.com',
      '/\\evil.com',
      '/foo\\bar',
      '/\t/evil.com',
      '/\n/evil.com',
      'https://evil.com',
      '',
      null,
    ]) {
      expect(isSafeRelativePath(value)).toBe(false);
    }
  });
});
