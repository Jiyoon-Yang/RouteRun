import { redirect } from "next/navigation"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createClient } from "@/lib/supabase/server"

import { requireAdmin } from "./require-admin"

vi.mock("next/navigation", () => ({
  // 실제 redirect처럼 throw해서 이후 코드가 실행되지 않게 한다
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

/** 세션 유저와 `admins` 조회 결과를 정한다. isAdmin(실제 코드)이 이 클라이언트로 조회한다 */
function session(
  user: { id: string } | null,
  adminsRow: { data: unknown; error: { message: string } | null } = {
    data: null,
    error: null,
  }
) {
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => adminsRow }) }),
  }))
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user } }) },
    from,
  } as never)
  return from
}

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks())

  it("세션이 없으면 /login으로 보낸다", async () => {
    session(null)
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT")
    expect(redirect).toHaveBeenCalledWith("/login")
  })

  it("로그인했어도 admins 명단에 없으면 /login으로 보낸다", async () => {
    const from = session({ id: "user-1" }, { data: null, error: null })
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT")
    expect(from).toHaveBeenCalledWith("admins")
    expect(redirect).toHaveBeenCalledWith("/login")
  })

  it("admins 조회가 실패하면 통과시키지 않는다", async () => {
    session({ id: "user-1" }, { data: null, error: { message: "db down" } })
    await expect(requireAdmin()).rejects.toThrow("db down")
  })

  it("admins 명단에 있으면 유저를 돌려준다", async () => {
    session({ id: "admin-1" }, { data: { user_id: "admin-1" }, error: null })
    await expect(requireAdmin()).resolves.toEqual({ id: "admin-1" })
    expect(redirect).not.toHaveBeenCalled()
  })
})
