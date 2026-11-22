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

- 전체 전송 약 3.4MB 중 약 2.9MB가 TMap(지도 타일·SDK 리소스). 우리 JS는 약 350KB, Supabase 데이터는 3KB 미만
- 홈 First Load JS 246 kB는 라우트 중 가장 크다(공통 87.4 kB 포함)

## 주의

- 로컬 실험실 측정이라 운영(Vercel·실기기) 수치와 다르다. 같은 기기에서 전후를 비교하는 용도
- 1회 측정은 LCP가 0.3초 넘게 흔들린다. 3회 중앙값만 비교한다
- 첫 방문 조건(빈 프로필)이라 홈에서 온보딩 모달이 뜬 상태로 잰다
- Lighthouse 13.6은 Node 22.19 이상을 권장한다(22.18에서 경고만 나고 동작)
