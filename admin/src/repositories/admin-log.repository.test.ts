import { describe, expect, it } from "vitest"

import { ilikeAny } from "./admin-log.repository"

describe("ilikeAny: 작업 기록 검색어를 PostgREST or 조건으로", () => {
  it("모든 컬럼에 같은 부분 일치 조건을 건다", () => {
    expect(ilikeAny(["target", "reason"], "스팸")).toBe(
      'target.ilike."%스팸%",reason.ilike."%스팸%"'
    )
  })

  it("쉼표·괄호는 큰따옴표 안에 있어 or 문법을 깨지 않는다", () => {
    expect(ilikeAny(["target"], "a,b)c")).toBe('target.ilike."%a,b)c%"')
  })

  it("%·_는 와일드카드가 아니라 글자로 찾는다", () => {
    // ilike 이스케이프(\%) 뒤 따옴표 문자열 이스케이프로 역슬래시가 한 번 더 붙는다
    expect(ilikeAny(["target"], "50%_")).toBe(
      'target.ilike."%50\\\\%\\\\_%"'
    )
  })

  it("큰따옴표·역슬래시가 따옴표 문자열을 끝내지 못한다", () => {
    expect(ilikeAny(["target"], 'a"b')).toBe('target.ilike."%a\\"b%"')
    expect(ilikeAny(["target"], "a\\b")).toBe('target.ilike."%a\\\\\\\\b%"')
  })
})
