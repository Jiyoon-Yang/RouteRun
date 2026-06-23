import { describe, expect, it } from 'vitest';

import {
  getRegionBucketFromAddress,
  getRegionBucketFromLatLng,
  REGION_BUCKET_LABEL,
  resolveRegionBucket,
} from './region-bucket';

describe('getRegionBucketFromAddress', () => {
  it('경기도 시군구 문자열을 gyeonggi로 매칭한다', () => {
    expect(getRegionBucketFromAddress('경기도 성남시')).toBe('gyeonggi');
  });

  it('서울 시군구 문자열을 seoul로 매칭한다', () => {
    expect(getRegionBucketFromAddress('서울 강남구')).toBe('seoul');
  });

  it('시/도만 있는 문자열도 매칭한다', () => {
    expect(getRegionBucketFromAddress('서울')).toBe('seoul');
  });

  it('인천을 gyeonggi 버킷으로 매칭한다', () => {
    expect(getRegionBucketFromAddress('인천 남동구')).toBe('gyeonggi');
  });

  it('강원을 gangwon으로 매칭한다', () => {
    expect(getRegionBucketFromAddress('강원도 춘천시')).toBe('gangwon');
  });

  it('충청권(충북/충남/대전/세종)을 chungcheong으로 매칭한다', () => {
    expect(getRegionBucketFromAddress('충청북도 청주시')).toBe('chungcheong');
    expect(getRegionBucketFromAddress('충청남도 천안시')).toBe('chungcheong');
    expect(getRegionBucketFromAddress('대전 유성구')).toBe('chungcheong');
    expect(getRegionBucketFromAddress('세종')).toBe('chungcheong');
  });

  it('경상권(경북/경남/대구/울산/부산)을 gyeongsang으로 매칭한다', () => {
    expect(getRegionBucketFromAddress('경상북도 포항시')).toBe('gyeongsang');
    expect(getRegionBucketFromAddress('경상남도 창원시')).toBe('gyeongsang');
    expect(getRegionBucketFromAddress('대구 수성구')).toBe('gyeongsang');
    expect(getRegionBucketFromAddress('울산 남구')).toBe('gyeongsang');
    expect(getRegionBucketFromAddress('부산 해운대구')).toBe('gyeongsang');
  });

  it('전라권(전북/전남/광주)을 jeolla로 매칭한다', () => {
    expect(getRegionBucketFromAddress('전라북도 전주시')).toBe('jeolla');
    expect(getRegionBucketFromAddress('전라남도 여수시')).toBe('jeolla');
    expect(getRegionBucketFromAddress('광주 서구')).toBe('jeolla');
  });

  it('제주를 jeju로 매칭한다', () => {
    expect(getRegionBucketFromAddress('제주특별자치도 제주시')).toBe('jeju');
  });

  it('null 또는 매칭 실패 시 null을 반환한다', () => {
    expect(getRegionBucketFromAddress(null)).toBeNull();
    expect(getRegionBucketFromAddress(undefined)).toBeNull();
    expect(getRegionBucketFromAddress('')).toBeNull();
    expect(getRegionBucketFromAddress('알수없는지역 어딘가구')).toBeNull();
  });
});

describe('getRegionBucketFromLatLng', () => {
  it('서울시청 근처 좌표는 seoul을 반환한다', () => {
    expect(getRegionBucketFromLatLng(37.5665, 126.978)).toBe('seoul');
  });

  it('제주 근처 좌표는 jeju를 반환한다', () => {
    expect(getRegionBucketFromLatLng(33.4996, 126.5312)).toBe('jeju');
  });

  it('항상 7개 버킷 중 하나를 반환한다(실패 없음)', () => {
    const bucket = getRegionBucketFromLatLng(0, 0);
    expect(Object.keys(REGION_BUCKET_LABEL)).toContain(bucket);
  });
});

describe('resolveRegionBucket', () => {
  it('주소 매칭이 성공하면 주소 기반 버킷을 우선 사용한다', () => {
    const bucket = resolveRegionBucket({
      region: '경기도 성남시',
      lat: 37.5665,
      lng: 126.978,
    });
    expect(bucket).toBe('gyeonggi');
  });

  it('주소가 없거나 매칭 실패 시 좌표 폴백을 사용한다', () => {
    const bucket = resolveRegionBucket({
      region: null,
      lat: 33.4996,
      lng: 126.5312,
    });
    expect(bucket).toBe('jeju');
  });
});
