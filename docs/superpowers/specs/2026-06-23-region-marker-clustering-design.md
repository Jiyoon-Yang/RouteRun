# 홈 지도 권역 단위 마커 클러스터링 설계

## 배경 / 문제

홈 지도에서 전국이 보이는 만큼 축소(zoom 6~11)하면 TMap SDK의 `extension.MarkerCluster`(거리 기반 그리드 클러스터)가 적용된다. 그런데 가장 축소된 상태(전국 전체가 보이는 줌)에서도 격자 단위로 잘게 뭉쳐서 코스/트랙이 의미 없이 여러 덩어리로 흩어져 보인다. 사용자는 이 최상위 줌 단계에서는 "경기/강원/충청/경상/전라" 같은 광역(시/도) 단위로만 뭉쳐 보이길 원한다.

## 목표

- zoom ≤ 7(전국이 거의 다 보이는 가장 축소된 단계): 코스/트랙을 8개 권역(서울 / 인천·경기 / 강원 / 충청 / 경상 / 전라 / 제주)으로 묶어 권역당 1개의 배지 마커("경기 24")로 표시한다.
- zoom 8~11: 기존 거리 기반 `MarkerCluster` 동작 유지(변경 없음).
- zoom 12+: 기존 개별 마커 동작 유지(변경 없음).
- 권역 배지 클릭 시 해당 권역으로 확대 이동한다.

## 비범위(Out of scope)

- 거리 기반 클러스터(zoom 8~11)와 개별 마커(zoom 12+) 로직 자체는 변경하지 않는다.
- 서버/DB 스키마 변경 없음. 기존 `start_address_region` 필드만 활용한다.

## 데이터 모델

`routes`/`tracks`의 `start_address_region`은 "시/도 + 시군구" 형식 문자열(예: `"경기도 성남시"`, `"서울 강남구"`, `"서울"`) 이거나 `null`이다(`src/repositories/map.repository.ts`의 `formatRegionAddress` 참고).

### 권역 버킷 정의

```
RegionBucket = 'seoul' | 'gyeonggi' | 'gangwon' | 'chungcheong' | 'gyeongsang' | 'jeolla' | 'jeju'
```

| 버킷 | 라벨 | 포함 시/도 |
|---|---|---|
| seoul | 서울 | 서울 |
| gyeonggi | 경기 | 경기, 인천 |
| gangwon | 강원 | 강원 |
| chungcheong | 충청 | 충북, 충남, 대전, 세종 |
| gyeongsang | 경상 | 경북, 경남, 대구, 울산, 부산 |
| jeolla | 전라 | 전북, 전남, 광주 |
| jeju | 제주 | 제주 |

## 설계

### 1. `src/commons/utils/region/region-bucket.ts` (신규)

순수 유틸 모듈.

- `RegionBucket` 타입 + `REGION_BUCKET_LABEL: Record<RegionBucket, string>`.
- `getRegionBucketFromAddress(region?: string | null): RegionBucket | null` — `start_address_region`의 앞부분(시/도)을 키워드 매칭하여 버킷 판별. 매칭 실패 시 `null`.
- `getRegionBucketFromLatLng(lat: number, lng: number): RegionBucket` — 주소 매칭이 안 될 때의 폴백. 7개 버킷의 대표 중심좌표 테이블을 두고, 입력 좌표와 유클리드 거리가 가장 가까운 버킷을 반환(항상 하나를 반환, 실패 없음).
- `resolveRegionBucket(params: { region?: string | null; lat: number; lng: number }): RegionBucket` — 주소 매칭 우선 시도 후 실패하면 좌표 폴백.

### 2. `src/components/tmap/home/utils/region-cluster-icon.ts` (신규)

- `buildRegionClusterIconDataUrl(label: string, count: number): string` — `data:image/svg+xml;...` 형태의 알약형 배지 아이콘을 동적 생성. 배경 `#16833e`(brand green), 흰색 텍스트로 `"${label} ${count}"` 표시. 텍스트 길이에 맞게 SVG width 가변 처리.

### 3. `src/components/tmap/home/hooks/useRegionClusterMarkers.ts` (신규)

기존 `useRouteMarkers.ts`의 클러스터 관리 패턴(teardown/rebuild, ref 기반 상태)을 따른다.

**입력 파라미터:**
- `mapRef: MutableRefObject<TmapMap | null>`
- `routesRef: MutableRefObject<Route[]>`
- `tracksRef: MutableRefObject<Track[]>` (신규 — 기존에는 트랙 원본 데이터에 접근하는 ref가 없었음)
- `regionClusterMarkersRef: MutableRefObject<Map<RegionBucket, TmapMarker>>`
- `getTmapv3: () => TmapV3API | undefined`

**제공 함수:**
- `syncRegionClusters(map: TmapMap): void`
  1. `routesRef.current`와 `tracksRef.current`를 합쳐 각 항목에 `resolveRegionBucket` 적용해 버킷별로 그룹화.
  2. 버킷별로 좌표 평균(centroid)과 건수를 계산.
  3. 이전에 그 버킷에 마커가 있었으면 위치/아이콘만 갱신, 없었으면 새로 생성(`Tmapv3.Marker`, icon = `buildRegionClusterIconDataUrl`).
  4. 더 이상 항목이 없는 버킷의 기존 마커는 `setMap(null)` 후 Map에서 제거.
  5. 각 마커에 클릭 리스너 바인딩 — 클릭 시 해당 버킷의 포인트들로 bounds 계산 → `map.fitBounds(bounds, 0)`(기존 `applyInitialViewport`와 동일 패턴, `Tmapv3.LatLngBounds` 사용). 포인트가 1개뿐이거나 bounds 폭이 0이면 `map.setCenter(...)` + `map.setZoom(9)`로 폴백(8~11 거리클러스터 단계로 진입).
- `clearRegionClusters(): void` — 모든 권역 마커 `setMap(null)` 후 Map 비움.

### 4. `useRouteMarkers.ts` 수정

- 상수 추가: `const ROUTE_MARKER_REGION_ZOOM_AT_OR_BELOW = 7;` (기존 `ROUTE_MARKER_CLUSTER_ZOOM_AT_OR_BELOW = 11`은 유지 — 8~11 구간이 거리기반 클러스터로 자동 유지됨).
- 파라미터에 `tracksRef: MutableRefObject<Track[]>`, `regionClusterMarkersRef: MutableRefObject<Map<RegionBucket, TmapMarker>>` 추가.
- 내부에서 `useRegionClusterMarkers` 호출해 `syncRegionClusters`/`clearRegionClusters` 획득.
- `syncRouteMarkersDisplayForZoom(map)` 최상단에 분기 추가:
  ```
  if (rawZoom <= ROUTE_MARKER_REGION_ZOOM_AT_OR_BELOW) {
    tearDownRouteMarkerCluster();
    개별 라우트/트랙 마커 setMap(null);
    syncRegionClusters(map);
    return;
  }
  clearRegionClusters(); // 이전에 region 모드였으면 정리
  // ↓ 기존 로직 그대로
  ```

### 5. `index.tsx` 수정

- `tracksRef = useRef<Track[]>(tracks)` 추가, 기존 `routesRef`와 동일한 패턴으로 `useEffect(() => { tracksRef.current = tracks }, [tracks])`로 최신화.
- `regionClusterMarkersRef = useRef<Map<RegionBucket, TmapMarker>>(new Map())` 추가.
- 두 ref를 `useRouteMarkers` 호출부에 전달.
- `useHomeMapLifecycle` 호출부에도 `regionClusterMarkersRef` 전달하여, 기존 unmount cleanup 블록(routeMarkerClusterRef 정리 부분과 동일 위치)에서 권역 마커들도 `setMap(null)` 처리.

### 6. `useHomeMapLifecycle.ts` 수정

- 파라미터에 `regionClusterMarkersRef` 추가.
- 기존 unmount cleanup(라인 ~239-253, `routeMarkerClusterRef`/`routeMarkerMap` 정리 블록) 옆에 region 마커 정리 코드 추가: `regionClusterMarkersRef.current.forEach((m) => m.setMap(null)); regionClusterMarkersRef.current.clear();`

## 동작 시나리오

1. **전국 보기 (zoom ≤ 7):** 개별 마커·거리기반 클러스터 모두 비활성. 각 권역에 코스/트랙이 있으면 "서울 8", "경기 24" 같은 녹색 배지 마커가 해당 권역 항목들의 평균 좌표에 표시됨. 항목이 없는 권역은 배지 자체가 없음.
2. **배지 클릭:** 해당 권역 항목들의 bounds로 `fitBounds` → 자동으로 zoom이 8 이상으로 올라가며 거리기반 클러스터(8~11) 또는 개별 마커(12+) 단계로 전환.
3. **줌 경계 통과(7↔8):** `handleZoomChanged`가 매번 `syncRouteMarkersDisplayForZoom`을 호출하므로 자동으로 region ↔ 거리클러스터 모드 전환.
4. **데이터 변경(routes/tracks props 갱신):** 기존처럼 `syncRouteMarkers`/tracks effect가 끝에 `syncRouteMarkersDisplayForZoom`을 호출하므로, region 모드 중에도 배지 건수/위치가 최신화됨.

## 테스트 계획

- `region-bucket.ts`에 대한 단위 테스트(vitest): 주소 문자열 다양한 케이스("경기도 성남시", "서울", "인천 남동구", `null`) → 올바른 버킷 매칭 확인. 좌표 폴백 케이스(주소 없이 좌표만으로 버킷 판별) 확인.
- `region-cluster-icon.ts`: 라벨/카운트에 따라 유효한 `data:image/svg+xml` 문자열 생성 확인.
- 수동 확인: `npm run dev` → 홈 화면에서 줌아웃해 zoom 6~7로 전국 보기 → 권역 배지 표시 확인 → 클릭 시 확대 이동 확인 → 줌인하여 8 이상에서 기존 거리기반 클러스터/개별 마커로 정상 전환되는지 확인.
