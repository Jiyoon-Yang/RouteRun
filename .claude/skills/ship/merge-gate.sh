#!/bin/bash
# /ship의 dev 자동 머지 판단. `gh pr checks <PR> --watch`로 체크가 끝난 뒤 실행한다.
# 종료 코드: 0 = 머지 가능 / 1 = 수정 필요(ci 실패, P0·P1 있음) / 2 = 중단하고 사용자에게 묻기
# 2인 경우: 최신 HEAD SHA와 일치하는 REVIEW_RESULT 줄이 없음(리뷰 skip·미완료·형식 오류), 자동 머지 금지 경로 변경
PR=${1:?사용법: merge-gate.sh <PR 번호>}

# .github·.claude: 하네스·CI 자체(리뷰가 skip되거나 스스로를 바꾼다), supabase: 운영 DB·Edge Function, middleware: 비공개 라우트 보호
FORBIDDEN='^(\.github/|\.claude/|supabase/|middleware\.ts$)'
TOUCHED=$(gh pr diff "$PR" --name-only | grep -E "$FORBIDDEN")
if [ -n "$TOUCHED" ]; then
  printf '중단: 자동 머지 금지 경로 변경 → 사용자 확인 필요\n%s\n' "$TOUCHED"
  exit 2
fi

CI=$(gh pr checks "$PR" --json name,bucket -q '.[] | select(.name=="ci") | .bucket')
if [ "$CI" = "fail" ]; then
  echo "수정 필요: ci 실패 (gh pr checks $PR 로그 확인)"
  exit 1
fi
if [ "$CI" != "pass" ]; then
  echo "중단: ci = ${CI:-없음} (체크가 없거나 아직 끝나지 않음)"
  exit 2
fi

JSON=$(gh pr view "$PR" --json headRefOid,comments) || exit 2
HEAD=$(jq -r .headRefOid <<<"$JSON")
LINE=$(jq -r '.comments[] | select(.author.login=="claude") | .body' <<<"$JSON" | tr -d '\r' |
  grep -E "^REVIEW_RESULT: sha=$HEAD P0=[0-9]+ P1=[0-9]+ P2=[0-9]+$" | tail -1)
if [ -z "$LINE" ]; then
  echo "중단: HEAD $HEAD 와 일치하는 REVIEW_RESULT 줄이 없다(리뷰 skip·미완료·형식 오류)"
  exit 2
fi

read -r P0 P1 P2 <<<"$(sed -E 's/.*P0=([0-9]+) P1=([0-9]+) P2=([0-9]+)$/\1 \2 \3/' <<<"$LINE")"
if [ "$P0" -eq 0 ] && [ "$P1" -eq 0 ]; then
  echo "머지 가능: ci pass, P0=0 P1=0 P2=$P2 (sha ${HEAD:0:7})"
  exit 0
fi
echo "수정 필요: P0=$P0 P1=$P1 P2=$P2 (sha ${HEAD:0:7})"
exit 1
