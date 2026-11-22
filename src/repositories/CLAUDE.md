# Repository 레이어

Supabase(DB)와 TMap REST에 대한 통신 창구. 비즈니스 로직·UI 상태를 두지 않는다.

## 규칙

- `SupabaseClient`를 매개변수로 받는 함수는 호출부(Service/Action)가 클라이언트를 주입한다. 독립적으로 실행돼야 하는 함수(예: `getRouteCountByUserId`, `deleteRoute`)만 내부에서 `createClient()`를 호출한다.
- 홈 지도(`home.repository.ts`)는 클라이언트 컴포넌트의 실시간 뷰포트 쿼리라 `@/lib/supabase/client`를, 나머지는 `@/lib/supabase/server`를 쓴다.
- 반환은 `{ data, error }` 또는 실패 시 `throw` 중 하나를 파일 안에서 일관되게 쓴다.
- **Row 타입·필드 목록(`ROUTE_SELECT`)·도메인 변환(`toRoute`, `normalizeRouteRows`)은 `course/route-row.ts`, `track/track-row.ts` 한 곳에만 둔다.** 쿼리마다 필드 목록을 inline으로 쓰지 않는다. 컬럼을 추가하면 이 파일만 고친다.

## 주의사항

- 홈 뷰포트 쿼리(`getHomeRoutesByViewport`)는 무거운 `path_data` 대신 `path_data->waypoint_points->0`만 받는다. 홈 목록에 `path_data`를 다시 넣지 말고, 선택한 코스는 `getHomeRoutePathData`로 조회한다.
- `map.repository.ts`는 TMap REST를 fetch로 직접 호출한다. `NEXT_PUBLIC_TMAP_API_KEY`가 없으면 `null`/`throw`로 처리한다.
- 숨긴 글 필터·수정 컬럼 grant 범위는 `content-rules.test.ts`가, `reports`·`admin_logs` 권한은 `db-permissions.test.ts`가 고정한다. 규칙을 바꾸면 테스트를 먼저 고친다.
