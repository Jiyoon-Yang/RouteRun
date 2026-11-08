---
name: release-pr
description: dev → main 배포 PR 생성. 아직 main에 반영되지 않은 dev PR들을 각각 요약해 본문에 담는다. "/release-pr", "dev를 main으로 PR", "운영 반영 PR" 요청 시 사용.
disable-model-invocation: true
---

# dev → main 배포 PR

로컬 브랜치와 무관하게 `origin/dev`와 `origin/main` 기준으로 동작한다. push는 하지 않는다 (`dev`는 이미 origin에 있음).

## 1. 확인

```bash
git fetch origin
git log --oneline origin/main..origin/dev   # 비어 있으면 "반영할 변경 없음"으로 끝낸다
gh pr list --base main --head dev --state open --json number,url   # 이미 열린 PR이 있으면 새로 만들지 말고 그 PR 본문 갱신(gh pr edit)을 제안한다
```

## 2. 포함된 PR 목록

`dev`에 머지됐지만 `main`엔 아직 없는 PR = 머지 커밋이 `origin/main..origin/dev` 범위에 있는 PR.

```bash
gh pr list --base dev --state merged --limit 100 --json number,title,mergeCommit \
  --jq '.[] | "\(.mergeCommit.oid) #\(.number) \(.title)"' \
  | grep -Ff <(git rev-list origin/main..origin/dev)
```

PR 없이 들어간 커밋이 있으면 (`git log` 결과에 위 PR로 설명되지 않는 커밋) "PR 없는 커밋"으로 따로 적는다.

## 3. PR별 요약

각 PR마다:

```bash
gh pr view <N> --json title,body,files
```

- 본문의 `📝 요약`·`🔎 주요 변경 사항`을 읽고 **핵심 1~3줄**로 줄인다. 본문이 부실하면 `files`와 `gh pr diff <N>`로 보충한다.
- `🧪 테스트 / 검증` 결과와 `⚠️` 배포 주의사항(시크릿, env, 함수 배포 순서 등)은 모아둔다.

추가로 `git diff --stat origin/main...origin/dev -- supabase/`에 변경이 있으면 배포 순서를 적는다: 마이그레이션은 머지 전 적용 여부 확인, `supabase/functions/` 변경은 **main 운영 배포 후** `supabase functions deploy <함수>`.

## 4. PR 생성

**제목:** `[release]: <포함 PR 핵심을 한 줄로> 운영 반영 (dev → main)`

**본문** (CLAUDE.md PR 템플릿 구조):

```markdown
### 📝 요약
- **무엇을**: `dev`에 머지된 #A, #B를 `main`에 반영
- **왜**: <포함 변경을 운영 배포하는 이유 한 줄>

---

### 🔎 주요 변경 사항
- #A `<PR 제목>`
  - **<핵심 변경 1>**
  - **<핵심 변경 2>**
- #B `<PR 제목>`
  - **<핵심 변경>**

---

### 🎯 의도 / Why
- **<운영 영향 요약. 문서·CI 전용이면 "운영 동작 영향 없음"이라고 명시>**

---

### 🧪 테스트 / 검증
- **로컬 빌드/실행**: <각 PR에서 확인된 결과를 PR 번호와 함께>
- **화면 확인**: <머지 후 운영에서 확인할 항목, 없으면 "해당 없음">

<배포 주의사항이 있을 때만>
**⚠️ 배포 순서**
1. ...

---

### ✅ 체크리스트
- [x] 토큰/변수 네이밍/사용처 **오탈자 없는지** 확인
- [x] 전역 적용 범위가 **의도한 영역만** 영향을 주는지 확인
- [x] (가능 시) 린트/타입체크 통과 확인

> 머지는 squash가 아니라 **merge commit**으로 해주세요 (다음 사이클 dev/main 충돌 방지).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

```bash
gh pr create --base main --head dev --title "<제목>" --body "$(cat <<'EOF'
<본문>
EOF
)"
```

## 5. 마무리

- PR URL과 포함된 PR 번호 목록을 알려준다.
- **머지하지 않는다.** 머지는 사용자가 merge commit으로 한다 (main 머지 = Vercel 운영 배포).
- Claude 자동 리뷰가 달리면 P0·P1 여부만 확인해 알려준다.
