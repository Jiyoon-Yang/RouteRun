#!/bin/bash
HOOK_INPUT=$(cat)
CMD=$(printf '%s' "$HOOK_INPUT" | jq -r '.tool_input.command // ""')

# git push 명령이 아니면 통과
if ! printf '%s' "$CMD" | grep -qE '^git push'; then
  exit 0
fi

TMPFILE=$(mktemp)
npm run build > "$TMPFILE" 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  CONTEXT=$(printf '빌드 에러 출력:\n%s' "$(head -c 3000 "$TMPFILE")")
  jq -n --arg context "$CONTEXT" \
    '{
      "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": "빌드 에러가 발생했습니다. 에러를 수정 후 다시 푸시하세요.",
        "additionalContext": $context
      }
    }'
fi

rm -f "$TMPFILE"
