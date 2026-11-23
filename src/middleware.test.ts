import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// src/app을 쓰는 프로젝트는 src/middleware.ts만 인식한다. 루트에 두면 에러 없이 꺼진다(실제로 운영에서 꺼져 있었다)
describe('middleware 위치', () => {
  it('src/middleware.ts에 있고 루트에는 없다', () => {
    expect(existsSync('src/middleware.ts')).toBe(true);
    expect(existsSync('middleware.ts')).toBe(false);
  });
});
