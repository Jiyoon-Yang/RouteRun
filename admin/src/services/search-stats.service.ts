import { unstable_cache } from "next/cache"

import { fetchSearchStats } from "@/repositories/search-stats.repository"

// 구글 데이터는 하루 단위로 갱신되니 대시보드를 열 때마다 부르지 않는다.
const getCachedSearchStats = unstable_cache(
  fetchSearchStats,
  ["search-stats"],
  { revalidate: 6 * 60 * 60 }
)

/**
 * 대시보드 검색 유입 카드 데이터. 환경 변수가 없으면(로컬 등) null.
 * 설정 전 null이 캐시에 남지 않도록 환경 변수 확인은 캐시 밖에서 한다.
 */
export async function getSearchStats() {
  const siteUrl = process.env.GSC_SITE_URL
  const propertyId = process.env.GA4_PROPERTY_ID

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !siteUrl || !propertyId) {
    return null
  }

  return getCachedSearchStats(siteUrl, propertyId)
}
