"use client"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/commons/components/ui/field"
import { Input } from "@/commons/components/ui/input"
import { Switch } from "@/commons/components/ui/switch"
import { Textarea } from "@/commons/components/ui/textarea"
import type { Notice, NoticeDraft } from "@/commons/types/admin"

export const EMPTY_NOTICE: NoticeDraft = { title: "", body: "", pinned: false }

export const toDraft = (notice?: Notice): NoticeDraft =>
  notice
    ? { title: notice.title, body: notice.body, pinned: notice.pinned }
    : EMPTY_NOTICE

export function NoticeFields({
  value,
  onChange,
  bodyRows = 8,
}: {
  value: NoticeDraft
  onChange: (value: NoticeDraft) => void
  bodyRows?: number
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="notice-title">제목</FieldLabel>
        <Input
          id="notice-title"
          value={value.title}
          maxLength={60}
          onChange={(event) =>
            onChange({ ...value, title: event.target.value })
          }
          placeholder="예: 11월 서버 점검 안내"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="notice-body">본문</FieldLabel>
        <Textarea
          id="notice-body"
          rows={bodyRows}
          value={value.body}
          onChange={(event) => onChange({ ...value, body: event.target.value })}
          placeholder="줄바꿈은 그대로 표시됩니다."
        />
      </Field>
      <Field orientation="horizontal">
        <Switch
          id="notice-pinned"
          checked={value.pinned}
          onCheckedChange={(pinned) => onChange({ ...value, pinned })}
        />
        <FieldLabel htmlFor="notice-pinned">상단 고정</FieldLabel>
        <FieldDescription className="ml-auto">
          고정은 1개만. 새로 고정하면 기존 고정이 풀립니다.
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}
