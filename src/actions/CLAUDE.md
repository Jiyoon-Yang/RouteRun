# Action 레이어

Next.js **Server Actions** (`'use server'`). 인증 확인 → 입력 검증 → Service/Repository 호출 → 캐시 무효화 순서로 실행한다.

## 규칙

- **세션 확인을 먼저 한다.** 인증이 필요한 액션은 `supabase.auth.getUser()`로 유저를 확인하고, 없으면 즉시 에러를 반환한다.
- 입력값의 기본 검증(빈 문자열, UUID 형식, 타입 체크 등)은 Action에서, 도메인 규칙 검증은 Service에서 한다.
- 성공 시 영향받는 경로에 `revalidatePath()`를 호출한다.
- **`redirect()`는 try/catch 안에서 호출하지 않는다.** 내부적으로 throw로 동작해 catch에 잡힌다.
- 반환 타입은 `{ success: true, data? }` 또는 `{ success: false, error/message }`로 통일한다. 성공 후 redirect하면 반환값 없이 `void`로 끝난다.

## 주의사항

- 등록 Action의 `addressRegion`은 클라이언트 훅(`useCourseSubmit`/`useTrackSubmit`)이 역지오코딩해 넘긴다. **서버에서 검증하지 않고** 그대로 `start_address_region`에 저장되며, 상세 페이지는 TMap 호출보다 이 값을 우선 사용한다.
- 등록·수정 Action은 게스트 한도 확인 후 `validatePostInput`(`commons/utils/post-input.ts`)으로 제목·설명·이미지를 서버에서 다시 검증한다. 이미지 URL은 `isOwnCourseImageUrl`을 통과한 본인 Storage 폴더 URL만 허용된다.
- `submitReportAction`: 유형·길이(10~500자) 검증 → 유저당 10분 3건 한도(조회 후 insert라 동시 요청은 조금 넘을 수 있음) → Service Role로 저장 → 최근 24시간 전체 50건 미만이고 `REPORT_EDGE_FUNCTION_URL`·`REPORT_EMAIL_SECRET`이 모두 있을 때만 메일 Edge Function 호출. 비밀값은 `x-report-secret` 헤더로 보내고(anon key는 공개라 인증 수단이 아님), 함수 실패는 로그만 남기고 성공으로 반환한다.
- `auth.action.ts`의 `resolveSiteOrigin()`은 `NEXT_PUBLIC_SITE_URL` → `VERCEL_URL` → `localhost` 순으로 폴백한다. 새 환경 추가 시 이 함수를 확인한다.
- redirect URL은 `isSafeRelativePath()`(`commons/utils/safe-path.ts`)로 사이트 내부 상대 경로만 허용해 open redirect를 막는다. 로그인 페이지·OAuth 콜백·동의 페이지도 같은 함수를 쓴다.
