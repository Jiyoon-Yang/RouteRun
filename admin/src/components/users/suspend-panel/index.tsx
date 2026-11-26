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
import { MAX_REASON, SUSPEND_PERIODS } from "@/commons/constants/content"
import type { Suspension } from "@/commons/types/admin"
import { formatDateTime } from "@/commons/utils/format"

// 정지 = 코스·트랙 작성·수정, 좋아요, 제보 차단. 로그인·조회·삭제·탈퇴는 그대로 둔다.
export function SuspendPanel({
  userId,
  suspension,
  onSuspend,
  onUnsuspend,
}: {
  userId: string
  suspension: Suspension | null
  onSuspend: (days: number, reason: string) => Promise<boolean>
  onUnsuspend: () => Promise<boolean>
}) {
  const [days, setDays] = useState(SUSPEND_PERIODS[0].days)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)
  const label = SUSPEND_PERIODS.find((period) => period.days === days)!.label

  async function submit(action: () => Promise<boolean>) {
    setPending(true)
    if (await action()) setReason("")
    setPending(false)
  }

  if (suspension) {
    return (
      <Alert variant="destructive">
        <BanIcon />
        <AlertTitle>
          {suspension.until
            ? `${formatDateTime(suspension.until)}까지 정지`
            : "영구 정지"}
        </AlertTitle>
        <AlertDescription>{suspension.reason}</AlertDescription>
        <AlertAction>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => submit(onUnsuspend)}
          >
            정지 해제
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>정지 기간</FieldLabel>
        <ToggleGroup
          variant="outline"
          value={[String(days)]}
          onValueChange={(value) => value[0] && setDays(Number(value[0]))}
        >
          {SUSPEND_PERIODS.map((period) => (
            <ToggleGroupItem key={period.days} value={String(period.days)}>
              {period.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor={`suspend-reason-${userId}`}>사유</FieldLabel>
        <Textarea
          id={`suspend-reason-${userId}`}
          rows={3}
          maxLength={MAX_REASON}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="예: 홍보 링크 반복 게시"
        />
        <FieldDescription>
          정지 중에는 코스·트랙 작성·수정, 좋아요, 제보가 막힙니다. 이미 쓴 글은
          코스·트랙 관리에서 따로 숨겨야 해요.
        </FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <Button
          variant="destructive"
          disabled={!reason.trim() || pending}
          onClick={() => submit(() => onSuspend(days, reason))}
        >
          <BanIcon data-icon="inline-start" />
          {label} 정지
        </Button>
      </Field>
    </FieldGroup>
  )
}
