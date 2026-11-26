"use server"

import type { UserFilters } from "@/commons/types/admin"
import { requireAdmin } from "@/lib/require-admin"
import { getUserDetail, getUsers } from "@/services/user.service"

const MAX_QUERY = 100

/** 조건에 맞는 유저 한 페이지. 실패하면 null을 돌려 화면에 안내만 띄운다. */
export async function getUsersAction(filters: UserFilters) {
  await requireAdmin()

  // 액션은 직접 호출될 수 있어서 입력을 다시 확인한다.
  const { type, query, page } = filters ?? {}
  if (
    !["all", "google", "guest"].includes(type) ||
    typeof query !== "string" ||
    query.length > MAX_QUERY ||
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    return null
  }

  try {
    return await getUsers({ type, query, page })
  } catch (error) {
    console.error("[getUsersAction]", error)
    return null
  }
}

/** 유저 한 명의 이메일·활동. 실패하면 null. */
export async function getUserDetailAction(userId: string) {
  await requireAdmin()

  if (typeof userId !== "string" || !userId) return null

  try {
    return await getUserDetail(userId)
  } catch (error) {
    console.error("[getUserDetailAction]", error)
    return null
  }
}
