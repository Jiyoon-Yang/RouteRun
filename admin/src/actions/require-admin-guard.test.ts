import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import ts from "typescript"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { requireAdmin } from "@/lib/require-admin"
import { getReports, updateReport } from "@/services/report.service"
import {
  getUserDetail,
  getUsers,
  suspendUser,
  unsuspendUser,
} from "@/services/user.service"

import { getReportsAction, updateReportAction } from "./report.action"
import {
  getUserDetailAction,
  getUsersAction,
  suspendUserAction,
  unsuspendUserAction,
} from "./user.action"

// 로그인 전에 불려서 requireAdmin을 넣으면 로그인이 막히는 액션
const PUBLIC_ACTIONS = new Set(["signInAction", "signOutAction"])
const ACTIONS_DIR = path.dirname(fileURLToPath(import.meta.url))

function isAwaitRequireAdmin(node: ts.Node | undefined): boolean {
  return (
    !!node &&
    ts.isAwaitExpression(node) &&
    ts.isCallExpression(node.expression) &&
    node.expression.expression.getText() === "requireAdmin"
  )
}

/** 함수 본문 첫 문장이 `await requireAdmin()` 또는 `const x = await requireAdmin()`인지 */
function startsWithRequireAdmin(fn: ts.FunctionDeclaration): boolean {
  const first = fn.body?.statements[0]
  if (!first) return false
  if (ts.isExpressionStatement(first))
    return isAwaitRequireAdmin(first.expression)
  if (ts.isVariableStatement(first)) {
    const [decl] = first.declarationList.declarations
    return (
      first.declarationList.declarations.length === 1 &&
      isAwaitRequireAdmin(decl.initializer)
    )
  }
  return false
}

// 위치·파일 이름과 상관없이 파일 단위 'use server'가 붙은 모듈은 전부 검사한다
// shortcut: 함수 안에 'use server'를 쓰는 인라인 액션은 못 잡는다. 생기면 여기서 함수 단위 지시문도 찾는다
const SRC_DIR = path.join(ACTIONS_DIR, "..")
const serverModules = (fs.readdirSync(SRC_DIR, { recursive: true }) as string[])
  .filter((file) => /\.tsx?$/.test(file) && !file.endsWith(".test.ts"))
  .map((file) => ({
    file,
    source: ts.createSourceFile(
      file,
      fs.readFileSync(path.join(SRC_DIR, file), "utf8"),
      ts.ScriptTarget.Latest,
      true
    ),
  }))
  .filter(({ source }) => {
    const first = source.statements[0]
    return (
      !!first &&
      ts.isExpressionStatement(first) &&
      ts.isStringLiteral(first.expression) &&
      first.expression.text === "use server"
    )
  })

describe("어드민 Server Action은 모두 첫 줄에서 requireAdmin()을 호출한다", () => {
  it("검사할 'use server' 파일이 있다", () => {
    expect(serverModules.length).toBeGreaterThan(0)
  })

  it.each(serverModules)("$file", ({ source }) => {
    const problems: string[] = []

    for (const statement of source.statements) {
      // `export { x }`·`export * from`·`export default 식`은 아래 검사를 피해 가므로 막는다(타입 re-export만 허용)
      if (
        (ts.isExportDeclaration(statement) && !statement.isTypeOnly) ||
        ts.isExportAssignment(statement)
      ) {
        problems.push(
          `${statement.getText()}: re-export·default 식 대신 export async function으로 선언한다`
        )
        continue
      }

      const exported = ts
        .getModifiers(statement as ts.HasModifiers)
        ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      if (!exported) continue

      if (ts.isFunctionDeclaration(statement)) {
        const name = statement.name?.text ?? "(익명)"
        if (!PUBLIC_ACTIONS.has(name) && !startsWithRequireAdmin(statement)) {
          problems.push(`${name}: 첫 문장이 await requireAdmin()이 아니다`)
        }
      } else if (ts.isVariableStatement(statement)) {
        // 'use server' 파일의 export는 전부 클라이언트가 직접 부를 수 있는 액션이다. 위 검사를 피하지 못하게 함수 선언만 허용
        problems.push(
          `${statement.declarationList.declarations[0].name.getText()}: export async function으로 선언한다`
        )
      }
    }

    expect(problems).toEqual([])
  })
})

vi.mock("@/lib/require-admin", () => ({ requireAdmin: vi.fn() }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }))
vi.mock("@/repositories/report.repository", () => ({
  countPendingReports: vi.fn(),
}))
vi.mock("@/services/report.service", () => ({
  getReports: vi.fn(),
  updateReport: vi.fn(),
}))

vi.mock("@/services/user.service", () => ({
  getUsers: vi.fn(),
  getUserDetail: vi.fn(),
  suspendUser: vi.fn(),
  unsuspendUser: vi.fn(),
}))

describe("어드민이 아니면 reports·admin_logs에 닿지 않는다", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 실제 requireAdmin은 비어드민을 redirect(throw)한다(require-admin.test.ts)
    vi.mocked(requireAdmin).mockRejectedValue(new Error("NEXT_REDIRECT"))
  })

  it("제보 목록을 조회하지 않는다", async () => {
    await expect(getReportsAction()).rejects.toThrow("NEXT_REDIRECT")
    expect(getReports).not.toHaveBeenCalled()
  })

  it("제보 상태를 바꾸지도, 조치 기록을 남기지도 않는다", async () => {
    await expect(
      updateReportAction("r1", { status: "resolved", adminNote: "" })
    ).rejects.toThrow("NEXT_REDIRECT")
    // updateReport가 reports 갱신과 logAdminAction(admin_logs)을 한다
    expect(updateReport).not.toHaveBeenCalled()
  })

  it("유저 목록·이메일을 조회하지 않는다", async () => {
    await expect(
      getUsersAction({ type: "all", query: "", page: 1 })
    ).rejects.toThrow("NEXT_REDIRECT")
    await expect(getUserDetailAction("u1")).rejects.toThrow("NEXT_REDIRECT")
    // getUserDetail이 Auth Admin API로 이메일을 읽는다
    expect(getUsers).not.toHaveBeenCalled()
    expect(getUserDetail).not.toHaveBeenCalled()
  })

  it("유저를 정지·해제하지도, 조치 기록을 남기지도 않는다", async () => {
    await expect(suspendUserAction("u1", 7, "스팸")).rejects.toThrow(
      "NEXT_REDIRECT"
    )
    await expect(unsuspendUserAction("u1")).rejects.toThrow("NEXT_REDIRECT")
    expect(suspendUser).not.toHaveBeenCalled()
    expect(unsuspendUser).not.toHaveBeenCalled()
  })
})
