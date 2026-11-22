# 성능 기준선

성능 PR은 `npm run perf`로 다시 재서 아래 표와 전후 비교를 PR 본문에 붙인다. 표가 없으면 미완료로 본다.
기준을 바꾸는 개선이 dev에 머지되면 이 표를 새 결과로 갱신한다.

측정: 2026-11-22 · efbbbff · lighthouse@13.6.0 · 모바일 · CPU 4x · RTT 60ms · 9Mbps · 3회 중앙값

| 페이지 | 점수 | LCP | TBT | First Load JS | 전체 전송 | 외부(TMap 등) 전송 | 지도 데이터 API | DOM 노드 |
|---|---|---|---|---|---|---|---|---|
| 홈 | 93 | 2.89 s | 160 ms | 246 kB | 3400.9 KiB | 2950.3 KiB | 2.7 KiB | 196 |
| 코스 상세 | 92 | 2.90 s | 192 ms | 204 kB | 3355.6 KiB | 2950.3 KiB | 0.0 KiB | 130 |

## 항목

- **First Load JS**: `next build` 라우트 표 값(gzip). 나머지는 Lighthouse JSON
- **외부 전송**: `third-parties-insight`에서 supabase.co를 뺀 합. 거의 전부 TMap 계열(타일 `tmap.co.kr`·`tmapmp.com`, SDK 리소스 `onestore.co.kr`)
- **지도 데이터 API**: Supabase `/rest/v1/`와 TMap REST(`apis.openapi.sk.com/tmap/`) Fetch·XHR 전송 합. 코스 상세는 서버 컴포넌트가 조회해 0
- **DOM 노드**: `dom-size-insight` Total elements

## 첫 측정에서 보인 것

- 전체 전송 약 3.4MB 중 약 2.9MB가 TMap. 내역: SDK 스크립트 `tmapjs3.min.js` 약 1.25MB, SDK가 받는 지도 설정·레이어(`*.ids.onestore.co.kr`) 약 1.2MB, 타일 약 0.5MB. 우리 JS는 약 270KB(그중 Supabase 클라이언트 약 64KB), Supabase 데이터는 3KB 미만
- 홈 LCP 요소는 지도 컨테이너(`#map_div .vsm-container`)라 SDK 다운로드·실행이 끝나야 찍힌다. SDK 실행만 메인 스레드 약 1.3초(CPU 4x)
- 홈 First Load JS 246 kB는 라우트 중 가장 크다(공통 87.4 kB 포함)

## 실험 기록

### 2026-11-22 TMap SDK 로딩 앞당기기 — 효과 없음, 되돌림

같은 날 3회 중앙값(홈 LCP / 코스 상세 LCP): 기준 3.27 s / 2.92 s → preconnect를 실제 SDK·설정·타일 서버 8곳으로 수정 2.81 s / 2.91 s → 여기에 로더를 `beforeInteractive`로 3.11 s / 2.82 s. 홈은 측정마다 2.8~3.3 s로 흔들려 오차 안이고, 같은 레이아웃을 쓰는 상세가 움직이지 않아 효과 없음으로 판단했다.

- **`beforeInteractive`는 쓰면 안 된다**: 첫 로딩에만 실행돼, 지도 없는 페이지에서 클라이언트 이동(마이페이지 카드 `router.push` → 상세)으로 들어오면 SDK가 로드되지 않는다. `e2e/home-to-detail.spec.ts`의 두 번째 테스트가 이 회귀를 잡는다
- **SDK preload 불가**: `vectorjs`가 SDK 서버를 `topopentile1~3` 중 무작위로 골라 `document.write`한다. 고정 주소로 preload하면 2/3 확률로 1.25MB를 두 번 받는다
- **SDK는 TMap 서버가 압축 없이 준다**(gzip 요청에도 1,281,499 bytes 그대로). 압축하면 약 350KB 수준이지만 우리 쪽에서 바꿀 수 없다. 재방문은 ETag·Last-Modified로 캐시된다
- 기존 preconnect `toptmaptile3.tmap.co.kr`은 실제 SDK 요청 호스트와 이름이 달라 연결이 재사용되지 않는다(DNS는 같은 `maptoptile.tmap.co.kr`). 고쳐도 측정 차이가 없어 그대로 뒀다

남은 선택지(코드보다 결정이 필요한 것): TMap SDK를 우리 도메인으로 압축 프록시·자체 호스팅(약관·버전 추적·`vectorjs` 대체 필요), 지도 전에 목록·스켈레톤을 먼저 보여 주는 체감 속도 개선.

## 주의

- 로컬 실험실 측정이라 운영(Vercel·실기기) 수치와 다르다. 같은 기기에서 전후를 비교하는 용도
- 1회 측정은 LCP가 0.3초 넘게 흔들리고, 같은 코드의 3회 중앙값도 날에 따라 0.4초쯤 다르다(2.89 s·3.27 s). 비교는 같은 날 같은 기기에서 잰 값끼리만 한다
- 첫 방문 조건(빈 프로필)이라 홈에서 온보딩 모달이 뜬 상태로 잰다
- Lighthouse 13.6은 Node 22.19 이상을 권장한다(22.18에서 경고만 나고 동작)
