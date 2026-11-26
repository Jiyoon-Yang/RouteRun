import { describe, expect, it } from 'vitest';

import { formatReportTarget, isValidReportTarget, parseReportTarget } from './report-target';

const ID = '94b6d98a-a20f-4074-8911-a7b46298a465';

describe('report-target', () => {
  it('route·track + UUID만 허용한다', () => {
    expect(isValidReportTarget({ type: 'route', id: ID })).toBe(true);
    expect(isValidReportTarget({ type: 'track', id: ID })).toBe(true);
    expect(isValidReportTarget({ type: 'user', id: ID })).toBe(false);
    expect(isValidReportTarget({ type: 'route', id: 'abc' })).toBe(false);
    expect(isValidReportTarget(null)).toBe(false);
  });

  it('쿼리 값을 파싱하고 다시 같은 값으로 만든다', () => {
    const target = parseReportTarget(`route:${ID}`);
    expect(target).toEqual({ type: 'route', id: ID });
    expect(formatReportTarget(target!)).toBe(`route:${ID}`);
  });

  it('잘못된 쿼리 값은 null', () => {
    for (const value of [undefined, '', 'route', `user:${ID}`, 'route:not-uuid']) {
      expect(parseReportTarget(value)).toBeNull();
    }
  });
});
