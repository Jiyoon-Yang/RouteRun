import "server-only"

import { createSign } from "node:crypto"

const TOKEN_URL = "https://oauth2.googleapis.com/token"

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url")

/**
 * 서비스 계정 키(`GOOGLE_SERVICE_ACCOUNT_JSON`)로 Google API 액세스 토큰을 받는다.
 * 토큰 발급만 필요해서 google-auth-library 대신 서명한 JWT를 직접 보낸다.
 */
export async function getGoogleAccessToken(scopes: string[]) {
  const { client_email, private_key } = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON!
  )
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: client_email,
    scope: scopes.join(" "),
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  })}`
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(private_key, "base64url")

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Google 토큰 발급 실패: ${response.status} ${await response.text()}`
    )
  }

  const { access_token } = (await response.json()) as { access_token: string }
  return access_token
}
