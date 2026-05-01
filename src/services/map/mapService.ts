// 홈/코스 작성 등 지도 화면에서 사용하는 지도 관련 비즈니스 로직
import type { ReverseGeocodeRegionParams } from '@/repositories/map.repository';
import { reverseGeocodeRegion } from '@/repositories/map.repository';

export async function reverseGeocodeRegionForHome(
  params: ReverseGeocodeRegionParams,
): Promise<string | null> {
  return reverseGeocodeRegion(params);
}
