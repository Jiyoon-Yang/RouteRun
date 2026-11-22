# Service 레이어

Repository 결과를 **조합·가공·검증**하는 비즈니스 로직 계층. Supabase 쿼리는 두지 않는다(예외는 루트 CLAUDE.md).

## 규칙

- 여러 Repository 결과 조합(`Promise.all`), 도메인 규칙, View Model 변환을 맡는다.
- 입력 유효성 검사(닉네임 형식 등)는 Service 또는 별도 validation 파일에 둔다. 외부 의존 없는 순수 함수는 `userValidation.ts`처럼 분리한다.
- `revalidatePath`·`redirect` 같은 Next.js 전용 API는 Action에서 쓴다. Service는 순수 비즈니스 로직만 담는다.
- 에러는 `console.error`로 로깅 후 `{ data, error }` 또는 `throw`로 상위에 전달한다.
- **SupabaseClient는 주입받는다.** 내부에서 직접 만드는 기존 함수가 섞여 있지만 신규 함수는 Server Component/Action이 만든 클라이언트를 매개변수로 받는다.

## 주요 패턴

- **상세 데이터 조합:** `fetchCourseDetail`은 코스를 먼저 조회한 뒤 작성자 프로필과 위치를 병렬로 가져온다. 위치는 DB의 `start_address_region`을 우선하고, 없을 때만 TMap을 호출한다.
- **Storage 정리:** `deleteCourse`/`updateCourse`(트랙도 동일)는 지워지거나 빠진 이미지를 `storageRepository.removeCourseImages`로 Storage에서도 삭제한다.
- **View Model 변환:** `routeToMypageCard`처럼 DB 모델(`Route`)을 UI 카드 타입으로 바꾸는 헬퍼를 Service 안에 둔다.
