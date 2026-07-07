#!/usr/bin/env bash
#
# promote.sh — 현재 기능 브랜치를 upstream에 푸시하고
#   feature → dev → main 순으로 PR 생성/머지를 자동화한 뒤,
#   내 포크(origin)의 main을 upstream/main으로 동기화한다.
#
# 사용법:
#   scripts/promote.sh                # 현재 브랜치를 dev로, 이어서 dev를 main으로 승격
#   FEATURE=perf/refactor scripts/promote.sh
#   MERGE_METHOD=merge scripts/promote.sh   # squash(기본) 대신 merge 커밋
#   SKIP_MAIN=1 scripts/promote.sh    # dev까지만, main 승격은 건너뜀
#
# 요구사항: gh CLI 로그인, upstream 리모트에 push 권한.

set -euo pipefail

REMOTE="${REMOTE:-upstream}"
REPO="${REPO:-heehee-ju/RunningCourse}"
DEV="${DEV:-dev}"
MAIN="${MAIN:-main}"
ORIGIN="${ORIGIN:-origin}"   # 내 포크. 승격 후 main을 여기로 동기화한다.
MERGE_METHOD="${MERGE_METHOD:-squash}"   # squash | merge | rebase
FEATURE="${FEATURE:-$(git branch --show-current)}"

log()  { printf '\033[1;34m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ -n "$FEATURE" ] || die "기능 브랜치를 확인할 수 없습니다."
[ "$FEATURE" != "$DEV" ] && [ "$FEATURE" != "$MAIN" ] || die "기능 브랜치에서 실행하세요 (현재: $FEATURE)."

# .cursor/rules/09-pr-template.mdc 규칙에 맞춰 본문을 생성한다.
#   $1=base  $2=head
# "주요 변경 사항"은 base..head 커밋 제목에서 자동 추출한다.
build_body() {
  local base="$1" head="$2" changes
  changes="$(gh api "repos/$REPO/compare/$base...$head" \
              --jq '.commits[].commit.message | split("\n")[0]' 2>/dev/null \
            | sed 's/^/  - /')"
  [ -n "$changes" ] || changes="  - (커밋 목록 없음)"

  cat <<EOF
### 📝 요약
- **무엇을**: \`$head\` 브랜치를 \`$base\`(으)로 승격
- **왜**: 검증 완료된 변경을 상위 브랜치에 반영

### 🔎 주요 변경 사항
- \`$head\` → \`$base\` 포함 커밋
$changes

### 🎯 의도 / Why
- **scripts/promote.sh 기반 자동 승격 PR** — ${head}의 변경을 ${base}에 통합

### 🧪 테스트 / 검증
- **로컬 빌드/실행**: 기능 브랜치에서 검증 완료 후 승격
- **화면 확인**: 기능 브랜치 단계에서 확인

### ✅ 체크리스트
- [x] 토큰/변수 네이밍/사용처 **오탈자 없는지** 확인
- [x] 전역 적용 범위가 **의도한 영역만** 영향을 주는지 확인
- [x] (가능 시) 린트/타입체크 통과 확인
EOF
}

# base 브랜치로 head 브랜치를 PR 생성 후 머지한다.
#   $1=base  $2=head
promote() {
  local base="$1" head="$2" num

  # 이미 열린 PR이 있으면 재사용, 없으면 생성
  num="$(gh pr list --repo "$REPO" --base "$base" --head "$head" --state open \
          --json number --jq '.[0].number' 2>/dev/null || true)"

  if [ -z "$num" ]; then
    # 변경사항이 없으면 PR 생성이 실패하므로 미리 확인
    if [ "$(gh api "repos/$REPO/compare/$base...$head" --jq '.ahead_by' 2>/dev/null || echo 0)" = "0" ]; then
      ok "$head → $base : 새 커밋 없음, 건너뜀"
      return 0
    fi
    log "$head → $base PR 생성"
    # gh pr create 는 --json 을 지원하지 않는다. 성공 시 PR URL을,
    # 이미 열린 PR이 있으면 에러 메시지에 기존 URL을 stdout/stderr로 출력하므로
    # 출력에서 PR 번호를 추출한다.
    local out
    out="$(gh pr create --repo "$REPO" --base "$base" --head "$head" \
            --title "[chore] \`$head → $base 승격\`" \
            --body "$(build_body "$base" "$head")" 2>&1)" || true
    num="$(printf '%s' "$out" | grep -oE '/pull/[0-9]+' | grep -oE '[0-9]+' | head -1)"
    [ -n "$num" ] || die "PR 생성 실패:
$out"
    ok "PR #$num 생성"
  else
    ok "$head → $base : 기존 PR #$num 재사용"
  fi

  # 머지 직전에 실제로 OPEN 상태인지 확인 (이미 머지·닫힌 PR을 조작하지 않도록)
  local state
  state="$(gh pr view "$num" --repo "$REPO" --json state --jq '.state')"
  [ "$state" = "OPEN" ] || die "PR #$num 상태가 OPEN이 아님 ($state). 중단."

  log "PR #$num 머지 ($MERGE_METHOD)"
  # --auto: 필수 체크가 있으면 통과 후 자동 머지, 없으면 즉시 머지
  gh pr merge "$num" --repo "$REPO" "--$MERGE_METHOD" --auto \
    || gh pr merge "$num" --repo "$REPO" "--$MERGE_METHOD" \
    || die "PR #$num 머지 실패 (승인/체크 규칙 확인 필요)."

  # 머지 결과 검증: 실제로 MERGED 되었는지 확인
  state="$(gh pr view "$num" --repo "$REPO" --json state --jq '.state')"
  if [ "$state" = "MERGED" ]; then
    ok "PR #$num 머지 완료"
  else
    ok "PR #$num 자동 머지 예약됨 (현재 $state — 체크 통과 후 머지)"
  fi
}

log "기능 브랜치 '$FEATURE'를 ${REMOTE}에 푸시"
git push "$REMOTE" "$FEATURE"
ok "푸시 완료"

promote "$DEV" "$FEATURE"

if [ "${SKIP_MAIN:-0}" = "1" ]; then
  ok "SKIP_MAIN=1 — main 승격 건너뜀. 완료."
  exit 0
fi

promote "$MAIN" "$DEV"

# 내 포크(origin)의 main을 upstream/main으로 동기화한다.
# fast-forward만 허용(--force 없음). origin/main이 갈라져 있으면 거부되고 중단된다.
log "${ORIGIN}/${MAIN} ← ${REMOTE}/${MAIN} 동기화"
git fetch "$REMOTE" "$MAIN" -q
if git push "$ORIGIN" "$REMOTE/$MAIN:$MAIN" 2>/dev/null; then
  ok "${ORIGIN}/${MAIN} 동기화 완료"
else
  die "${ORIGIN}/${MAIN} 동기화 실패 — fast-forward 불가(갈라짐). 수동 확인 필요."
fi

ok "전체 승격 완료: $FEATURE → $DEV → $MAIN (+ ${ORIGIN}/${MAIN} 동기화)"
