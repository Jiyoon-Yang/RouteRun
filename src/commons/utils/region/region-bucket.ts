export type RegionBucket =
  | 'seoul'
  | 'gyeonggi'
  | 'gangwon'
  | 'chungcheong'
  | 'gyeongsang'
  | 'jeolla'
  | 'jeju';

export const REGION_BUCKET_LABEL: Record<RegionBucket, string> = {
  seoul: '서울',
  gyeonggi: '경기',
  gangwon: '강원',
  chungcheong: '충청',
  gyeongsang: '경상',
  jeolla: '전라',
  jeju: '제주',
};

// 시/도 표기 변형(약칭/full name/공백)을 모두 포괄하는 키워드 매칭 테이블.
// 배열의 앞쪽일수록 더 구체적인 키워드를 두어 오매칭을 줄인다.
const REGION_BUCKET_KEYWORDS: Array<{ bucket: RegionBucket; keywords: string[] }> = [
  { bucket: 'seoul', keywords: ['서울'] },
  { bucket: 'gyeonggi', keywords: ['경기', '인천'] },
  { bucket: 'gangwon', keywords: ['강원'] },
  { bucket: 'chungcheong', keywords: ['충북', '충남', '충청', '대전', '세종'] },
  { bucket: 'gyeongsang', keywords: ['경북', '경남', '경상', '대구', '울산', '부산'] },
  { bucket: 'jeolla', keywords: ['전북', '전남', '전라', '광주'] },
  { bucket: 'jeju', keywords: ['제주'] },
];

export function getRegionBucketFromAddress(region?: string | null): RegionBucket | null {
  if (!region) return null;
  const trimmed = region.trim();
  if (!trimmed) return null;

  for (const { bucket, keywords } of REGION_BUCKET_KEYWORDS) {
    if (keywords.some((keyword) => trimmed.includes(keyword))) {
      return bucket;
    }
  }
  return null;
}

type Coordinate = { lat: number; lng: number };

// 각 권역의 대표 중심좌표(광역 단위 시청/도청 근방) — 좌표 폴백 시 최근접 버킷 판별용.
const REGION_BUCKET_CENTROIDS: Record<RegionBucket, Coordinate> = {
  seoul: { lat: 37.5665, lng: 126.978 },
  gyeonggi: { lat: 37.4138, lng: 127.5183 },
  gangwon: { lat: 37.8228, lng: 128.1555 },
  chungcheong: { lat: 36.6357, lng: 127.4917 },
  gyeongsang: { lat: 35.8714, lng: 128.6014 },
  jeolla: { lat: 35.1595, lng: 126.8526 },
  jeju: { lat: 33.4996, lng: 126.5312 },
};

export function getRegionBucketFromLatLng(lat: number, lng: number): RegionBucket {
  let closestBucket: RegionBucket = 'seoul';
  let closestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const bucket of Object.keys(REGION_BUCKET_CENTROIDS) as RegionBucket[]) {
    const centroid = REGION_BUCKET_CENTROIDS[bucket];
    const dLat = lat - centroid.lat;
    const dLng = lng - centroid.lng;
    const distanceSquared = dLat * dLat + dLng * dLng;
    if (distanceSquared < closestDistanceSquared) {
      closestDistanceSquared = distanceSquared;
      closestBucket = bucket;
    }
  }
  return closestBucket;
}

export function resolveRegionBucket(params: {
  region?: string | null;
  lat: number;
  lng: number;
}): RegionBucket {
  const fromAddress = getRegionBucketFromAddress(params.region);
  if (fromAddress) return fromAddress;
  return getRegionBucketFromLatLng(params.lat, params.lng);
}
