import { describe, expect, it } from 'vitest';

import { buildRegionClusterIconDataUrl } from './region-cluster-icon';

describe('buildRegionClusterIconDataUrl', () => {
  it('data:image/svg+xml 형식의 문자열을 반환한다', () => {
    const result = buildRegionClusterIconDataUrl('경기', 24);
    expect(result.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('라벨과 카운트 텍스트를 SVG에 포함한다', () => {
    const result = buildRegionClusterIconDataUrl('경기', 24);
    const decoded = decodeURIComponent(result.replace('data:image/svg+xml;charset=UTF-8,', ''));
    expect(decoded).toContain('경기 24');
    expect(decoded).toContain('#16833e');
  });

  it('라벨 길이가 길어지면 SVG width가 더 커진다', () => {
    const shortResult = buildRegionClusterIconDataUrl('서울', 3);
    const longResult = buildRegionClusterIconDataUrl('인천경기', 12345);
    const extractWidth = (dataUrl: string): number => {
      const decoded = decodeURIComponent(dataUrl.replace('data:image/svg+xml;charset=UTF-8,', ''));
      const match = decoded.match(/width="(\d+)"/);
      if (!match) throw new Error('width attribute not found');
      return Number(match[1]);
    };
    expect(extractWidth(longResult)).toBeGreaterThan(extractWidth(shortResult));
  });
});
