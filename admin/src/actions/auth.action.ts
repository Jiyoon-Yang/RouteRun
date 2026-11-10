"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/repositories/admin.repository"

export type SignInState = { error: string; email: string } | null

/** 이메일 로그인 후 `admins`에 없으면 바로 로그아웃시킨다. 성공하면 `/`로 redirect. */
export async function signInAction(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email")
  const password = formData.get("password")
  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "이메일과 비밀번호를 입력하세요.", email: "" }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.code !== "invalid_credentials") {
      console.error("[signInAction]", error)
    }
    return {
      error:
        error.code === "invalid_credentials"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : "로그인에 실패했습니다. 잠시 후 다시 시도하세요.",
      email,
    }
  }

  if (!(await isAdmin(supabase, data.user.id))) {
    await supabase.auth.signOut()
    return { error: "관리자로 등록된 계정이 아닙니다.", email }
  }

  redirect("/")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
