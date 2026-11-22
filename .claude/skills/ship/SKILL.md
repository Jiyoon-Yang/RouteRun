---
name: ship
description: 작업을 워크트리에서 시작해 검증 → dev PR → Claude 리뷰 확인·수정 반복 → 조건 충족 시 dev 머지·정리까지 끝낸다. 기능·버그·리팩터링·테스트·문서 등 코드 변경 작업을 시작하거나 마무리할 때, "/ship", "PR 해줘", "올려줘", "머지까지" 요청 시 사용.
---

# /ship — 작업 시작부터 dev 머지까지

끝 기준: **dev에 머지되고 브랜치·워크트리가 정리된 상태.** main 반영은 사용자가 `/release-pr`로 한다(가드가 main 머지·push를 막는다).

## 1. 시작

새 작업마다 `EnterWorktree`로 `.claude/worktrees/<이름>`을 만든다. 메인 체크아웃은 여러 세션이 같이 쓰니 거기서 `git checkout`하지 않는다.

```bash
git fetch origin dev && git branch -m feat/<기능명> && git reset --hard origin/dev   # 워크트리는 메인 HEAD에서 갈라지므로 최신 dev로 맞춘다
```

- `.env.local`·`admin/.env.local`은 복사되고, `node_modules`·`admin/node_modules`는 메인 체크아웃 것을 심볼릭 링크로 쓴다
- 워크트리에서 `npm install`로 의존성을 추가하면 **메인 체크아웃 node_modules에는 들어가지 않는다.** 머지 후 메인에서 `npm install`
- 어드민 dev·build는 워크트리에서 `--webpack`을 붙인다

## 2. 검증 (push 전에 모두 통과)

| 바꾼 곳 | 명령 |
|---|---|
| 항상 | `npx tsc --noEmit`, `npm run lint`, `npm test` |
| UI·인터랙션 | `npx vitest run --project storybook` |
| 홈·지도·코스/트랙 상세 | `npm run e2e` (홈→상세 스모크, Supabase 쓰기 요청 0건 감시) |
| 성능 작업 | `npm run perf` → `docs/perf/baseline.md`와 전후 표를 PR 본문에 |
| `admin/` | `cd admin && npm run lint && npm run typecheck` |
| `.claude/hooks/guard.sh` | `bash .claude/hooks/guard.test.sh` |

- UI를 바꿨으면 chrome-devtools로 화면을 직접 확인한다. 사용자에게 넘기지 않는다
- **운영 DB 하나뿐이다.** 브라우저 확인에서 등록·수정·삭제·좋아요·게스트 로그인처럼 운영 데이터에 쓰는 동작은 하지 않는다. 꼭 필요하면 멈추고 묻는다
- 반복되는 실수는 문서보다 ESLint 규칙·타입·테스트로 막는 쪽을 먼저 고려한다

Storybook 테스트 문제:
- Playwright 브라우저가 없다는 에러 → `npx playwright install chromium`
- `useRouter`(next/navigation)를 쓰는 컴포넌트 스토리 → `parameters: { nextjs: { appDirectory: true } }`
- `useAuth`·`useModal`을 쓰는 컴포넌트 → `AuthProvider`·`ModalProvider` 데코레이터(`navigation-bar` 스토리 참고)

## 3. PR

push는 워크트리 루트에서 한다(push 전 빌드 훅이 현재 위치에서 빌드). `gh pr create --base dev`.

**제목:** `[type(scope)]: 한 줄 요약` (예: `[refactor(layout)]: 루트 레이아웃 단일화`)

**본문:**

```
### 📝 요약
- **무엇을**: <변경 내용 요약>
- **왜**: <변경 이유>

---

### 🔎 주요 변경 사항
- `변경 파일/영역`
  - **핵심 변경 1**
  - **핵심 변경 2**

---

### 🎯 의도 / Why
- **<의도 설명>**

---

### 🧪 테스트 / 검증
- **로컬 빌드/실행**: <결과>
- **화면 확인**: <확인 항목>

---

### ✅ 체크리스트
- [x] 토큰/변수 네이밍/사용처 **오탈자 없는지** 확인
- [x] 전역 적용 범위가 **의도한 영역만** 영향을 주는지 확인
- [x] (가능 시) 린트/타입체크 통과 확인
```

## 4. 리뷰 확인 → 수정 반복 (최대 3회)

```bash
gh pr checks <PR> --watch --interval 20 > /dev/null
bash .claude/skills/ship/merge-gate.sh <PR>; echo $?
```

`merge-gate.sh`는 ci 결과, **최신 HEAD SHA와 일치하는** `REVIEW_RESULT: sha=… P0= P1= P2=` 줄(작성자 `claude`), 자동 머지 금지 경로를 본다. `review` check가 초록이어도 리뷰가 skip됐을 수 있으니 check 색깔로 판단하지 않는다.

| 종료 코드 | 할 일 |
|---|---|
| 0 | 5단계 머지 |
| 1 | 인라인 코멘트(`gh api repos/{owner}/{repo}/pulls/<PR>/comments`)와 요약을 읽고 P0·P1을 고쳐 push → 다시 4단계. 3회째에도 1이면 멈추고 남은 지적을 보고 |
| 2 | 멈추고 사용자에게 묻는다(금지 경로 변경 `.github/`·`.claude/`·`supabase/`·`middleware.ts`, 결과 줄 없음, ci 없음·미완료). 단 결과 줄만 없고 `review` check가 끝났으면, 리뷰 봇이 코멘트를 못 남긴 경우가 있어(#46) `gh run rerun <review run id>`로 한 번 재실행한 뒤 다시 본다 |

- P2는 PR 코멘트로 남겨 두고 따로 처리하지 않는다
- 리뷰 지적이 틀렸다고 판단하면 고치지 말고 이유를 사용자에게 보고한다

## 5. 머지와 정리

```bash
gh pr merge <PR> --merge                       # squash 아님. dev/main 충돌 방지
git fetch origin dev && git checkout --detach origin/dev
git branch -D feat/<기능명> && git push origin --delete feat/<기능명>
```

`ExitWorktree`(remove, HEAD가 `origin/dev`와 같고 변경 없음을 확인한 뒤 `discard_changes: true`) → 메인 체크아웃에서 `git pull --ff-only origin dev`, 의존성을 바꿨으면 `npm install`.

마지막 보고: PR 링크, 리뷰 회차별 P0·P1, 남긴 P2, main 릴리스가 필요한지(dev에만 있는 변경).
