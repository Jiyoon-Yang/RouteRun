# 지도 초기화와 위치 조회 분리 설계

## 문제

홈·코스등록·트랙등록 지도 3곳이 모두 `navigator.geolocation.getCurrentPosition` 완료를 기다린 뒤 지도를 초기화한다. 브라우저는 권한 다이얼로그 응답 전까지 `PositionOptions.timeout` 타이머를 시작하지 않으므로, 사용자가 다이얼로그를 무시하면 지도가 영원히 뜨지 않는다.

## 목표

- 권한 다이얼로그 응답 여부와 무관하게 지도가 즉시 초기화되어야 한다.
- 위치를 허용하면 지도가 해당 위치로 자연스럽게 이동한다.
- 새 추상화·파일을 추가하지 않는다.

## 영향 범위

### 수정 대상 (3곳)

| 파일 | 현재 문제 |
|------|----------|
| `src/components/tmap/home/hooks/useHomeMapLifecycle.ts` | `getCurrentPositionWithFallback` → `initTmap` 순서로 위치에 지도가 종속 |
| `src/components/tmap/courses-submit/index.tsx` | 동일 패턴 |
| `src/components/tmap/tracks-submit/index.tsx` | 동일 패턴 |

### 수정 불필요 (2곳)

| 파일 | 이유 |
|------|------|
| `src/components/tmap/course-detail/index.tsx` | DB 저장 좌표(`course.start_lat/lng`) 사용, geolocation 미사용 |
| `src/components/tmap/track-detail/index.tsx` | 동일 |

## 설계

### 핵심 패턴 (3곳 동일 적용)

```
BEFORE:
  geolocation 완료(또는 서울시청 fallback) → 지도 초기화

AFTER:
  지도 즉시 초기화(SEOUL_CITY_HALL_COORDINATE)
  ↓ 비동기(독립)
  navigator.geolocation.getCurrentPosition
    성공 → map.setCenter(실제 위치) + 위치 마커 갱신
    실패/거부 → 아무 처리 없음 (서울시청 그대로)
```

### useHomeMapLifecycle.ts

- `startWithLocation()` 함수 제거
- SDK 준비 확인 후 `initTmap(SEOUL_CITY_HALL_COORDINATE)` 즉시 호출
- `initTmap` 완료 후 `navigator.geolocation.getCurrentPosition` 비동기 실행
  - 성공 시: `initialViewport`가 없을 때만 `centerMapToLocationInVisibleArea`, 항상 `createCurrentLocationMarker`
  - 실패/거부 시: no-op

### courses-submit/index.tsx, tracks-submit/index.tsx

- `getCurrentPositionWithFallback` gate 제거
- SDK + DOM 준비 즉시 `initializeMap(서울시청)` 호출
- 서울시청 좌표로 `createCurrentLocationMarker` 즉시 생성
- `navigator.geolocation.getCurrentPosition` 비동기 실행
  - 성공 시: `map.setCenter(실제 위치)` + `createCurrentLocationMarker` 갱신
  - 실패/거부 시: no-op

### 변경하지 않는 것

- `getCurrentPositionWithFallback` — "내 위치 새로고침" 버튼(`handleRefreshLocation`)에서 계속 사용. 버튼 클릭은 사용자 의도이므로 fallback 동작(서울시청 이동)이 적절함.
- `geolocation.ts`의 `DEFAULT_GEOLOCATION_OPTIONS` — 초기 위치 비동기 조회에 그대로 사용

## 동작 시나리오

| 사용자 행동 | 결과 |
|------------|------|
| 다이얼로그 무시 | 서울시청으로 지도 즉시 표시 |
| 위치 허용 | 지도 즉시 표시 → 실제 위치로 자연스럽게 이동 |
| 위치 거부 | 서울시청으로 지도 즉시 표시, 이동 없음 |
