# 지도 초기화와 위치 조회 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 위치 권한 다이얼로그 무시 시 지도가 뜨지 않는 버그를 수정한다. 지도를 서울시청 좌표로 즉시 초기화하고, geolocation은 별도 비동기로 실행해 성공 시 지도를 실제 위치로 이동한다.

**Architecture:** 3개 파일에서 "geolocation 완료 → 지도 초기화" 순서를 "지도 즉시 초기화 → geolocation 비동기" 순서로 변경한다. 새 파일·추상화 없음. `getCurrentPositionWithFallback`은 "새로고침" 버튼에서 계속 사용한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, TMap Vector SDK, navigator.geolocation API

---

### Task 1: useHomeMapLifecycle.ts — 임포트 수정 및 startWithLocation 제거

**Files:**
- Modify: `src/components/tmap/home/hooks/useHomeMapLifecycle.ts:8-11`

- [ ] **Step 1: 임포트 변경**

`getCurrentPositionWithFallback`은 이 파일에서 더 이상 사용하지 않으므로 제거하고, `DEFAULT_GEOLOCATION_OPTIONS`와 `SEOUL_CITY_HALL_COORDINATE`를 추가한다.

파일 상단 임포트 블록을 아래로 교체한다:

```typescript
import {
  DEFAULT_GEOLOCATION_OPTIONS,
  PRECISE_GEOLOCATION_OPTIONS,
} from '@/commons/utils/geo/geolocation';
import { SEOUL_CITY_HALL_COORDINATE } from '@/commons/utils/geo';
```

- [ ] **Step 2: startWithLocation 제거 및 checkLibrary 수정**

현재 코드(lines 196~213):
```typescript
const startWithLocation = () => {
  getCurrentPositionWithFallback((lat, lng) => {
    initTmap(lat, lng);
  });
};

function checkLibrary() {
  if (isTmapRuntimeReady(getTmapv3())) {
    sdkRetryCount = 0;
    startWithLocation();
  } else {
    sdkRetryCount += 1;
    if (sdkRetryCount % 25 === 0) {
      // eslint-disable-next-line no-console
      console.warn('[TmapHome] Tmap SDK 로딩 대기 중...');
    }
    scheduleSdkRetry();
  }
}
```

아래로 교체한다:
```typescript
function checkLibrary() {
  if (isTmapRuntimeReady(getTmapv3())) {
    sdkRetryCount = 0;
    initTmap(SEOUL_CITY_HALL_COORDINATE.lat, SEOUL_CITY_HALL_COORDINATE.lng);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          const map = mapRef.current;
          if (!map) return;
          const { latitude, longitude } = position.coords;
          if (!initialViewport) {
            centerMapToLocationInVisibleArea(map, latitude, longitude);
          }
          createCurrentLocationMarker(map, latitude, longitude);
        },
        () => {
          // 거부/에러: 서울시청 그대로 유지
        },
        DEFAULT_GEOLOCATION_OPTIONS,
      );
    }
  } else {
    sdkRetryCount += 1;
    if (sdkRetryCount % 25 === 0) {
      // eslint-disable-next-line no-console
      console.warn('[TmapHome] Tmap SDK 로딩 대기 중...');
    }
    scheduleSdkRetry();
  }
}
```

- [ ] **Step 3: 타입체크 및 린트 확인**

```bash
npx tsc --noEmit && npm run lint
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/tmap/home/hooks/useHomeMapLifecycle.ts
git commit -m "refactor(tmap): 홈 지도 초기화를 위치 조회와 분리"
```

---

### Task 2: courses-submit/index.tsx — 임포트 수정 및 init 분리

**Files:**
- Modify: `src/components/tmap/courses-submit/index.tsx`

- [ ] **Step 1: 임포트 추가**

현재:
```typescript
import { getCurrentPositionWithFallback } from '@/commons/utils/geo/geolocation';
```

아래로 교체한다 (`getCurrentPositionWithFallback`은 handleRefreshLocation에서 계속 필요):
```typescript
import {
  DEFAULT_GEOLOCATION_OPTIONS,
  getCurrentPositionWithFallback,
} from '@/commons/utils/geo/geolocation';
import { SEOUL_CITY_HALL_COORDINATE } from '@/commons/utils/geo';
```

- [ ] **Step 2: useEffect 내 initialize 함수 수정**

현재 `initialize` 함수(lines 40~56):
```typescript
const initialize = () => {
  if (cancelled) return;
  const mapElementId = mapContainerIdRef.current;
  if (!getTmapv3Runtime() || !document.getElementById(mapElementId)) {
    window.setTimeout(initialize, 120);
    return;
  }

  getCurrentPositionWithFallback((lat, lng) => {
    if (cancelled) return;
    initializeMap(mapElementId, { lat, lng });
    const map = mapRef.current;
    if (map) {
      createCurrentLocationMarker(map as TmapMap, lat, lng);
    }
  });
};
```

아래로 교체한다:
```typescript
const initialize = () => {
  if (cancelled) return;
  const mapElementId = mapContainerIdRef.current;
  if (!getTmapv3Runtime() || !document.getElementById(mapElementId)) {
    window.setTimeout(initialize, 120);
    return;
  }

  initializeMap(mapElementId, SEOUL_CITY_HALL_COORDINATE);
  const map = mapRef.current;
  if (map) {
    createCurrentLocationMarker(
      map as TmapMap,
      SEOUL_CITY_HALL_COORDINATE.lat,
      SEOUL_CITY_HALL_COORDINATE.lng,
    );
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const liveMap = mapRef.current;
        if (!liveMap) return;
        const Tmapv3 = getTmapv3Runtime();
        if (!Tmapv3) return;
        const { latitude: lat, longitude: lng } = position.coords;
        (liveMap as TmapMap).setCenter(new Tmapv3.LatLng(lat, lng));
        createCurrentLocationMarker(liveMap as TmapMap, lat, lng);
      },
      () => {
        // 거부/에러: 서울시청 그대로 유지
      },
      DEFAULT_GEOLOCATION_OPTIONS,
    );
  }
};
```

- [ ] **Step 3: 타입체크 및 린트 확인**

```bash
npx tsc --noEmit && npm run lint
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/tmap/courses-submit/index.tsx
git commit -m "refactor(tmap): 코스등록 지도 초기화를 위치 조회와 분리"
```

---

### Task 3: tracks-submit/index.tsx — 임포트 수정 및 init 분리

**Files:**
- Modify: `src/components/tmap/tracks-submit/index.tsx`

- [ ] **Step 1: 임포트 추가**

현재:
```typescript
import { getCurrentPositionWithFallback } from '@/commons/utils/geo/geolocation';
```

아래로 교체한다:
```typescript
import {
  DEFAULT_GEOLOCATION_OPTIONS,
  getCurrentPositionWithFallback,
} from '@/commons/utils/geo/geolocation';
import { SEOUL_CITY_HALL_COORDINATE } from '@/commons/utils/geo';
```

- [ ] **Step 2: useEffect 내 initialize 함수 수정**

현재 `initialize` 함수(lines 39~55):
```typescript
const initialize = () => {
  if (cancelled) return;
  const mapElementId = mapContainerIdRef.current;
  if (!getTmapv3Runtime() || !document.getElementById(mapElementId)) {
    window.setTimeout(initialize, 120);
    return;
  }

  getCurrentPositionWithFallback((lat, lng) => {
    if (cancelled) return;
    initializeMap(mapElementId, { lat, lng });
    const map = mapRef.current;
    if (map) {
      createCurrentLocationMarker(map as TmapMap, lat, lng);
    }
  });
};
```

아래로 교체한다:
```typescript
const initialize = () => {
  if (cancelled) return;
  const mapElementId = mapContainerIdRef.current;
  if (!getTmapv3Runtime() || !document.getElementById(mapElementId)) {
    window.setTimeout(initialize, 120);
    return;
  }

  initializeMap(mapElementId, SEOUL_CITY_HALL_COORDINATE);
  const map = mapRef.current;
  if (map) {
    createCurrentLocationMarker(
      map as TmapMap,
      SEOUL_CITY_HALL_COORDINATE.lat,
      SEOUL_CITY_HALL_COORDINATE.lng,
    );
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const liveMap = mapRef.current;
        if (!liveMap) return;
        const Tmapv3 = getTmapv3Runtime();
        if (!Tmapv3) return;
        const { latitude: lat, longitude: lng } = position.coords;
        (liveMap as TmapMap).setCenter(new Tmapv3.LatLng(lat, lng));
        createCurrentLocationMarker(liveMap as TmapMap, lat, lng);
      },
      () => {
        // 거부/에러: 서울시청 그대로 유지
      },
      DEFAULT_GEOLOCATION_OPTIONS,
    );
  }
};
```

- [ ] **Step 3: 타입체크 및 린트 확인**

```bash
npx tsc --noEmit && npm run lint
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/tmap/tracks-submit/index.tsx
git commit -m "refactor(tmap): 트랙등록 지도 초기화를 위치 조회와 분리"
```

---

### Task 4: 수동 검증

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 시나리오별 확인**

각 페이지(홈 `/`, 코스등록 `/courses/new`, 트랙등록 `/tracks/new`)에서:

| 시나리오 | 확인 방법 | 기대 결과 |
|----------|----------|----------|
| 다이얼로그 무시 | 팝업 뜨면 클릭하지 말고 기다림 | 지도가 서울시청으로 즉시 표시 |
| 위치 허용 | "허용" 클릭 | 지도가 서울시청으로 뜬 후 실제 위치로 이동 |
| 위치 거부 | "거부" 클릭 | 서울시청 그대로 유지 |
| 새로고침 버튼 | 허용/거부 후 위치 버튼 클릭 | 기존과 동일하게 동작 |
