"use server"

import { requireAdmin } from "@/lib/require-admin"
import {
  getSearchStats,
  getSignupSources,
} from "@/services/search-stats.service"

/** 대시보드 검색 유입 카드 조회. 구글 API가 실패하면 null을 돌려 카드에 안내만 띄운다. */
export async function getSearchStatsAction() {
  await requireAdmin()

  try {
    return await getSearchStats()
  } catch (error) {
    console.error("[getSearchStatsAction]", error)
    return null
  }
}

/** 대시보드 가입 경로 카드 조회. 실패하면 null을 돌려 카드에 안내만 띄운다. */
export async function getSignupSourcesAction() {
  await requireAdmin()

  try {
    return await getSignupSources()
  } catch (error) {
    console.error("[getSignupSourcesAction]", error)
    return null
  }
}
