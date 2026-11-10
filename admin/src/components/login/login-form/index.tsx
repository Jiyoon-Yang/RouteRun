"use client"

import { useActionState } from "react"

import { signInAction } from "@/actions/auth.action"
import { Button } from "@/commons/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/commons/components/ui/field"
import { Input } from "@/commons/components/ui/input"
import { Spinner } from "@/commons/components/ui/spinner"

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, null)

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@example.com"
            // 액션이 끝나면 React가 폼을 비우므로, 실패 시 입력한 이메일을 되살린다
            defaultValue={state?.email}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">비밀번호</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <FieldDescription>
            계정은 Supabase 대시보드에서만 만듭니다. 비밀번호 재설정은 다른
            관리자에게 요청하세요.
          </FieldDescription>
        </Field>
        <Field data-invalid={state ? true : undefined}>
          {state && <FieldError>{state.error}</FieldError>}
          <Button type="submit" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            로그인
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
