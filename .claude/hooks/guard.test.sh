#!/bin/bash
# guard.sh 판정 자가 점검. guard.sh를 고치면 `bash .claude/hooks/guard.test.sh`로 확인한다.
# gh pr merge 사례는 존재하지 않는 PR 번호라 base 조회 실패 → ask가 기대값이다.
G="$(dirname "$0")/guard.sh"
FAIL=0
export GUARD_BRANCH=feat/test # 실행 중인 체크아웃 브랜치(CI의 main push 등)에 결과가 흔들리지 않게 고정
t() {
  local exp=$1 cmd=$2 out
  out=$(jq -n --arg c "$cmd" '{tool_input:{command:$c}}' | bash "$G" | jq -r '.hookSpecificOutput.permissionDecision')
  out=${out:-allow}
  if [ "$out" = "$exp" ]; then printf 'ok    %-5s %s\n' "$out" "$cmd"; else printf 'FAIL  %-5s (기대 %s) %s\n' "$out" "$exp" "$cmd"; FAIL=1; fi
}

t deny  'git push origin main'
t deny  'git push origin HEAD:main'
t deny  'git push -f origin +main'
t deny  'git push origin refs/heads/main'
t deny  'git push --all origin'
t deny  'git -C . push origin main'
t deny  "git push origin 'HEAD:main'"
t deny  'git push origin "main"'
t deny  'git push origin HEAD:main; echo done'
t allow 'git push -u origin feat/harness-guardrails'
t allow 'git push origin feat/main-thing'
t allow 'git push -u origin feat/maintenance'
GUARD_BRANCH=main t deny 'git push'
t deny  'bash -c "git push origin main"'
t deny  "sh -c 'git push origin HEAD:main'"
t deny  "sh -c 'vercel --prod'"
t ask   'bash -c "supabase db push"'
t ask   "{ psql \$DATABASE_URL; }"
t ask   "bash -c 'node -e 1'"
t ask   'gh pr merge 99999 --merge'
t deny  'gh api repos/x/y/pulls/3/merge -X PUT'
t deny  "gh api graphql -f query='mutation{mergePullRequest(input:{})}'"
t ask   'gh api repos/x/y/issues/3/comments -f body=hi'
t allow 'gh api repos/x/y/pulls/3/comments'
t ask   'gh api --method=DELETE repos/x/y/rulesets/1'
t ask   'gh api -X delete repos/x/y/rulesets/1'
t ask   'gh api repos/x/y/issues/3/comments --field=body=hi'
t deny  'vercel --prod'
t deny  'npx vercel deploy --prod'
t ask   'vercel env pull'
t allow 'cat vercel.json'
t allow 'cat src/components/Button.tsx'
t allow 'grep -rn foo --include=*.tsx src'
t allow 'npx eslint src/app/page.tsx'
t ask   'supabase db push'
t ask   'supabase functions deploy send-report-email'
t allow 'supabase --version'
t ask   'psql $DATABASE_URL'
t ask   'curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" https://x'
t allow 'grep -rn SUPABASE_SERVICE_ROLE_KEY src'
t ask   'cat .env.local'
t ask   'grep KEY admin/.env.local'
t allow 'cat admin/package.json'
t ask   "node -e 'console.info(1)'"
t ask   'npx tsx scripts/x.ts'
t allow 'node scripts/check.js'
t ask   "sed -i '' 's/a/b/' .github/workflows/ci.yml"
t ask   'echo x > .claude/settings.json'
t allow 'cat .github/workflows/ci.yml 2>&1'
t allow 'npm test'

exit $FAIL
