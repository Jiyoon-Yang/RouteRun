"use client"

import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/commons/components/ui/alert-dialog"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/commons/components/ui/field"
import { Textarea } from "@/commons/components/ui/textarea"
import { MAX_REASON } from "@/commons/constants/content"

// 사유가 필요한 조치(숨김·사진 삭제)의 확인창. 사유는 admin_logs.reason으로 저장한다.
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  placeholder,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  placeholder: string
  onOpenChange: (open: boolean) => void
  /** 반영에 성공하면 true. 실패하면 사유를 지우지 않는다. */
  onConfirm: (reason: string) => Promise<boolean>
}) {
  const [reason, setReason] = useState("")
  const [isPending, setIsPending] = useState(false)

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open) setReason("")
        onOpenChange(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="action-reason">사유</FieldLabel>
          <Textarea
            id="action-reason"
            rows={3}
            value={reason}
            maxLength={MAX_REASON}
            onChange={(event) => setReason(event.target.value)}
            placeholder={placeholder}
          />
          <FieldDescription>작업 기록에 남습니다.</FieldDescription>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!reason.trim() || isPending}
            onClick={async () => {
              setIsPending(true)
              const ok = await onConfirm(reason.trim()).finally(() =>
                setIsPending(false)
              )
              if (ok) setReason("")
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
