#!/bin/bash
# 운영 DB 하나뿐인 환경용 Bash 가드.
# main 반영은 차단(deny), 운영 DB·배포·비밀값·CI 수정은 사람 확인(ask).
# shortcut: 명령 문자열 정규식이라 따옴표 안 문구에 오탐하고 `cd .github && echo > x`처럼 쪼갠 명령은 못 잡는다.
#   필수 방어선은 원격 Rulesets. 다만 Claude가 사용자 gh 자격증명을 쓰므로 main 머지는 여기서만 막힌다.
CMD=$(jq -r '.tool_input.command // ""')
BRANCH=${GUARD_BRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null)}
CMD_START='(^|[;&|(`[:space:]])' # 명령 위치(파일명 `Button.tsx`·`vercel.json` 제외)

decide() {
  jq -n --arg d "$1" --arg r "$2" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:$d,permissionDecisionReason:$r}}'
  exit 0
}
has() { printf '%s' "$CMD" | grep -qE -- "$1"; }
has_i() { printf '%s' "$CMD" | grep -qiE -- "$1"; }

# 1) main 직접 push: `git -C dir push`, `origin main`, `'HEAD:main'`, `+main`, `refs/heads/main;`, --all/--mirror, main 브랜치에서의 push
if has "${CMD_START}git([[:space:]]+-[Cc][[:space:]]+[^[:space:]]+|[[:space:]]+-[^[:space:]]+)*[[:space:]]+push"; then
  if has "(^|[[:space:]:+\"'])(refs/heads/)?main(\$|[[:space:]\"';&|)])" || has '--(all|mirror)\b'; then
    decide deny "main push 금지. main 반영은 사용자가 직접 한다. (명령에 main 단어가 있으면 오탐일 수 있으니 명령을 나눠라)"
  fi
  [ "$BRANCH" = "main" ] && decide deny "main 브랜치에서 push 금지."
fi

# 2) PR 머지: base가 main이면 차단, base를 못 읽으면 확인
if has 'gh[[:space:]]+pr[[:space:]]+merge'; then
  TARGET=$(printf '%s' "$CMD" | awk '{for(i=1;i<=NF;i++) if($i=="merge"){for(j=i+1;j<=NF;j++) if($j !~ /^-/){print $j; exit} exit}}')
  BASE=$(gh pr view $TARGET --json baseRefName -q .baseRefName 2>/dev/null)
  [ "$BASE" = "main" ] && decide deny "main 대상 PR 머지 금지. 사용자가 직접 머지한다."
  [ -z "$BASE" ] && decide ask "PR base 브랜치를 확인하지 못했다. 머지 대상을 확인해 달라."
fi

# 3) gh api로 머지·ref 변경 우회, 그 밖의 쓰기 호출(`--method=DELETE`, `-X delete`, `--field=x` 포함)
if has 'gh[[:space:]]+api'; then
  has '/merges?\b|mergePullRequest|git/refs|updateRef' && decide deny "gh api로 머지·ref 변경 금지."
  has_i '(-X|--method)[[:space:]=]*(post|put|patch|delete)' && decide ask "gh api 쓰기 호출. 내용을 확인해 달라."
  has '[[:space:]](-f|-F|--field|--raw-field|--input)([[:space:]=]|$)|graphql' && decide ask "gh api 쓰기 호출. 내용을 확인해 달라."
fi

# 4) 배포
has "${CMD_START}(npx[[:space:]]+)?vercel([[:space:]].*)?--prod" && decide deny "vercel 운영 배포 금지."
has "${CMD_START}(npx[[:space:]]+)?vercel([[:space:]]|\$)" && decide ask "vercel 명령(배포·env)."

# 5) 운영 DB·Edge Function·비밀값
has "${CMD_START}(npx[[:space:]]+)?supabase[[:space:]]+(db|migration|secrets|functions)\b" && decide ask "운영 Supabase에 반영될 수 있는 명령."
has "${CMD_START}psql([[:space:]]|\$)" && decide ask "운영 DB 직접 접속."
has '\$\{?SUPABASE_SERVICE_ROLE_KEY|process\.env\.SUPABASE_SERVICE_ROLE_KEY' && decide ask "Service Role 키를 쓰는 명령."
has "(^|[[:space:]/\"'=])\.env(\.[A-Za-z]+)*([[:space:]\"';|)]|\$)" && decide ask ".env 파일 접근(비밀값)."
has "${CMD_START}node[[:space:]]+(-e|--eval|-p|--print)([[:space:]]|\$)|${CMD_START}(npx[[:space:]]+)?(tsx|ts-node)([[:space:]]|\$)" \
  && decide ask "일회성 스크립트 실행. 운영 DB를 건드리는지 확인해 달라."

# 6) CI·하네스 설정을 셸로 수정
has '(sed[[:space:]]+-i|perl[[:space:]]+-p?i|\btee\b|\bmv\b|\bcp\b|\brm\b|>)[^|;&]*(\.github/|\.claude/(settings|hooks))' \
  && decide ask "CI 워크플로·하네스 설정 수정."

exit 0
