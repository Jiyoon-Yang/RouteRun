import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const SERVICE_ROLE_ENV_MESSAGE =
  "SUPABASE_SERVICE_ROLE_KEY는 RLS를 우회하는 비밀 키라 클라이언트 번들에 들어가면 DB 전체가 열린다. src/lib/supabase/admin.ts(server-only)에서만 읽는다(NEXT_PUBLIC_ 접두사 금지). 다른 곳은 createAdminClient()를 쓴다."
const LIKES_COUNT_MESSAGE =
  "likes_count는 DB 트리거(sync_route_likes_count/sync_track_likes_count)가 좋아요 행 insert·delete 때 갱신한다. 직접 쓰면 실제 좋아요 수와 어긋난다. 좋아요 행만 다루고 likes_count는 읽기만 한다."

const likesCountSelectors = [
  {
    selector:
      "CallExpression[callee.property.name=/^(update|upsert|insert)$/] Property[key.name='likes_count']",
    message: LIKES_COUNT_MESSAGE,
  },
  {
    selector:
      "CallExpression[callee.property.name=/^(update|upsert|insert)$/] Property[key.value='likes_count']",
    message: LIKES_COUNT_MESSAGE,
  },
]
const serviceRoleEnvSelectors = [
  "MemberExpression[property.name=/SERVICE_ROLE/]",
  "MemberExpression[property.value=/SERVICE_ROLE/]",
  "ObjectPattern > Property[key.name=/SERVICE_ROLE/]",
].map((selector) => ({ selector, message: SERVICE_ROLE_ENV_MESSAGE }))

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 레이어 규칙: 데이터는 컴포넌트 훅 → Server Action → Service → Repository. 허용 경로는 아래 블록에서 연다
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase/*", "**/lib/supabase/*", "@supabase/*"],
              allowTypeImports: true,
              message:
                "어드민 레이어 규칙(훅 → Server Action → Service → Repository) 위반. page·컴포넌트·훅은 Server Action만 부른다. Service Role 클라이언트(createAdminClient)는 Service(또는 Repository를 바로 부르는 Action)에서 만들어 Repository에 주입한다. 타입만 필요하면 `import type`을 쓴다.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...serviceRoleEnvSelectors,
        ...likesCountSelectors,
      ],
    },
  },
  {
    // Action·Service는 src/lib/supabase 팩토리로만 클라이언트를 만든다(키 읽기·server-only를 한 곳에 모으기 위해)
    files: ["src/actions/**", "src/services/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*"],
              allowTypeImports: true,
              message:
                "Supabase 클라이언트는 @/lib/supabase/admin(createAdminClient, Service Role)이나 @/lib/supabase/server(세션)로만 만든다. 키와 server-only 보호가 그 파일들에 있다.",
            },
          ],
        },
      ],
    },
  },
  {
    // 클라이언트 팩토리와 세션 갱신 proxy
    files: ["src/lib/**", "src/proxy.ts"],
    rules: { "@typescript-eslint/no-restricted-imports": "off" },
  },
  {
    files: ["src/lib/supabase/admin.ts"],
    rules: { "no-restricted-syntax": ["error", ...likesCountSelectors] },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
