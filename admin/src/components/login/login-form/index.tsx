"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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

// 시안: 실제 구현은 Supabase signInWithPassword → admins 테이블 확인 → 아니면 signOut + 에러.
export function LoginForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get("email") as string
    if (!email.endsWith("@example.com")) {
      setError("관리자로 등록된 계정이 아닙니다.")
      return
    }
    setError(null)
    setPending(true)
    setTimeout(() => router.push("/"), 600)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@example.com"
            defaultValue="admin@example.com"
            aria-invalid={error ? true : undefined}
            required
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">비밀번호</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            defaultValue="password"
            required
          />
          <FieldDescription>
            계정은 Supabase 대시보드에서만 만듭니다. 비밀번호 재설정은 다른
            관리자에게 요청하세요.
          </FieldDescription>
        </Field>
        <Field>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            로그인
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
