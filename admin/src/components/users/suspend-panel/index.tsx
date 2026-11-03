"use client"

import { useState } from "react"
import { BanIcon } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/commons/components/ui/alert"
import { Button } from "@/commons/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/commons/components/ui/field"
import { Textarea } from "@/commons/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/commons/components/ui/toggle-group"
import { formatDate } from "@/commons/utils/format"
import { MOCK_NOW } from "@/commons/mocks"
import type { User } from "@/commons/types/admin"

const PERIODS = [
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
  { label: "영구", days: 0 },
]

// 정지 = 작성·좋아요·제보 차단. 로그인과 조회는 그대로 둔다.
export function SuspendPanel({
  user,
  onChange,
}: {
  user: User
  onChange: (patch: Pick<User, "suspendedUntil" | "suspendReason">) => void
}) {
  const [period, setPeriod] = useState("7일")
  const [reason, setReason] = useState("")

  if (user.suspendedUntil) {
    return (
      <Alert variant="destructive">
        <BanIcon />
        <AlertTitle>
          {user.suspendedUntil.startsWith("9999")
            ? "영구 정지"
            : `${formatDate(user.suspendedUntil)}까지 정지`}
        </AlertTitle>
        <AlertDescription>{user.suspendReason}</AlertDescription>
        <AlertAction>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({ suspendedUntil: null, suspendReason: null })
            }
          >
            정지 해제
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  function suspend() {
    const days = PERIODS.find((item) => item.label === period)!.days
    const until = days
      ? new Date(
          Date.parse(MOCK_NOW) + days * 24 * 60 * 60 * 1000
        ).toISOString()
      : "9999-12-31T00:00:00+09:00"
    onChange({ suspendedUntil: until, suspendReason: reason.trim() })
    setReason("")
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>정지 기간</FieldLabel>
        <ToggleGroup
          variant="outline"
          value={[period]}
          onValueChange={(value) => value[0] && setPeriod(value[0])}
        >
          {PERIODS.map((item) => (
            <ToggleGroupItem key={item.label} value={item.label}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor={`suspend-reason-${user.id}`}>사유</FieldLabel>
        <Textarea
          id={`suspend-reason-${user.id}`}
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="예: 홍보 링크 반복 게시"
        />
        <FieldDescription>
          정지 중에는 코스·트랙 작성, 좋아요, 제보가 막힙니다. 이미 쓴 글은 따로
          숨겨야 해요.
        </FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <Button
          variant="destructive"
          disabled={!reason.trim()}
          onClick={suspend}
        >
          <BanIcon data-icon="inline-start" />
          {period} 정지
        </Button>
      </Field>
    </FieldGroup>
  )
}
