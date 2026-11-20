import fs from "node:fs"
import path from "node:path"

import ts from "typescript"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { requireAdmin } from "@/lib/require-admin"
import { getReports, updateReport } from "@/services/report.service"

import { getReportsAction, updateReportAction } from "./report.action"

// 로그인 전에 불려서 requireAdmin을 넣으면 로그인이 막히는 액션
const PUBLIC_ACTIONS = new Set(["signInAction", "signOutAction"])
const ACTIONS_DIR = path.dirname(new URL(import.meta.url).pathname)

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

const actionFiles = fs
  .readdirSync(ACTIONS_DIR)
  .filter((file) => file.endsWith(".action.ts"))

describe("어드민 Server Action은 모두 첫 줄에서 requireAdmin()을 호출한다", () => {
  it("검사할 액션 파일이 있다", () => {
    expect(actionFiles.length).toBeGreaterThan(0)
  })

  it.each(actionFiles)("%s", (file) => {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(path.join(ACTIONS_DIR, file), "utf8"),
      ts.ScriptTarget.Latest,
      true
    )
    const problems: string[] = []

    for (const statement of source.statements) {
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
})
