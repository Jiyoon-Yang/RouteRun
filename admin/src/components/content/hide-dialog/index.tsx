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

// 숨김은 사유 필수. 사유는 admin_logs.reason으로 저장한다.
export function HideDialog({
  target,
  onOpenChange,
  onConfirm,
}: {
  target: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")

  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) setReason("")
        onOpenChange(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{target} 숨김</AlertDialogTitle>
          <AlertDialogDescription>
            사용자 앱의 홈·목록·상세·마이페이지에서 모두 사라집니다. 데이터는
            남아 있어 언제든 되돌릴 수 있어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="hide-reason">사유</FieldLabel>
          <Textarea
            id="hide-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="예: 홍보 링크 포함"
          />
          <FieldDescription>작업 기록에 남습니다.</FieldDescription>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim())
              setReason("")
            }}
          >
            숨김
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
