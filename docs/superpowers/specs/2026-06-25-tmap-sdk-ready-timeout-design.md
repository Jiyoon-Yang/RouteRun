# TMap SDK 준비 polling 타임아웃·에러 UI 설계

## 문제

TMap을 쓰는 5개 컴포넌트가 모두 SDK(또는 SDK+DOM 컨테이너)가 준비될 때까지 120ms 간격으로 무한 polling한다. 최대 재시도 횟수나 타임아웃이 없어서, 네트워크가 극단적으로 느리거나 SDK 로드가 영구히 실패하면 사용자는 빈 화면을 무한정 보게 되고 어떤 피드백도 받지 못한다.

해당 패턴이 있는 곳:

| 파일 | 준비 조건 |
|------|----------|
| `src/components/tmap/home/hooks/useHomeMapLifecycle.ts` | SDK(`Tmapv3.Map`, `Tmapv3.LatLng` 함수 존재) |
| `src/components/tmap/course-detail/index.tsx` | SDK + DOM 컨테이너(`document.getElementById`) |
| `src/components/tmap/track-detail/index.tsx` | SDK + DOM 컨테이너 |
| `src/components/tmap/courses-submit/index.tsx` | SDK + DOM 컨테이너 |
| `src/components/tmap/tracks-submit/index.tsx` | SDK + DOM 컨테이너 |

## 목표

- 누적 대기 5초가 지나면 polling을 멈추고 "지도를 불러올 수 없습니다 + 다시 시도" 오버레이를 보여준다.
- "다시 시도" 클릭 시 5초 타임아웃을 처음부터 다시 시작한다.
- 5곳의 polling 로직을 중복 작성하지 않고 공유 훅 하나로 처리한다.
- 각 컴포넌트의 지도 초기화 로직(마커, 줌, fitBounds 등)은 그대로 둔다 — 손대는 건 "준비될 때까지 기다리는 부분"뿐이다.

## 설계

### 공유 훅: `useTmapReadyPoll`

새 파일: `src/commons/utils/tmap/useTmapReadyPoll.ts`

```ts
type TmapReadyStatus = 'pending' | 'ready' | 'timeout';

function useTmapReadyPoll(checkReady: () => boolean, timeoutMs = 5000) {
  const [status, setStatus] = useState<TmapReadyStatus>('pending');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | null = null;
    const deadline = Date.now() + timeoutMs;

    function poll() {
      if (cancelled) return;
      if (checkReady()) {
        setStatus('ready');
        return;
      }
      if (Date.now() >= deadline) {
        setStatus('timeout');
        return;
      }
      timerId = window.setTimeout(poll, 120);
    }

    poll();

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [checkReady, timeoutMs, retryToken]);

  const retry = useCallback(() => {
    setStatus('pending');
    setRetryToken((token) => token + 1);
  }, []);

  return { status, retry };
}
```

- **타임아웃 기준은 누적 횟수가 아니라 `Date.now()` 기반 데드라인** — 탭이 백그라운드라 `setTimeout`이 밀려도 정확하게 5초로 판정된다.
- **`checkReady`는 호출 측이 `useCallback`으로 메모이즈해서 전달** — 컴포넌트마다 "SDK만" 또는 "SDK+DOM" 등 다른 조건을 자유롭게 넣을 수 있다.
- **`retry()`는 사용자의 "다시 시도" 클릭과 내부 레이스 컨디션 복구(아래 home 케이스) 모두에 동일하게 쓴다** — 둘 다 "처음부터 다시 기다린다"는 의미가 같으므로 별도 API를 만들지 않는다.

### 각 컴포넌트 적용 방식

공통 패턴:

```ts
const checkReady = useCallback(() => {
  return !!document.getElementById(mapContainerId) && !!getTmapv3Runtime();
}, [mapContainerId]);

const { status, retry } = useTmapReadyPoll(checkReady);

useEffect(() => {
  if (status !== 'ready') return;
  // 기존 지도 생성 로직 (polling 부분만 제거하고 나머지 그대로)
}, [status, /* 기존 의존성 */]);
```

기존 `pollTimer`/`window.setTimeout(..., 120)` 직접 호출 코드는 제거하고 `useTmapReadyPoll`로 대체한다.

#### `useHomeMapLifecycle.ts` (가장 복잡한 케이스)

기존에 `initTmap` 생성자 호출이 실패(SDK 전역은 있지만 생성자가 아직 안 붙은 race)하면 `scheduleSdkRetry()`로 재시도하던 catch 블록이 있다. 이 경우도 `retry()`를 그대로 호출해 동일한 폴링 루프로 흡수한다 — race는 보통 다음 120ms 안에 해소되므로 데드라인이 사실상 즉시 다시 채워져도 사용자가 체감하는 차이는 없다.

`checkReady`는 `isTmapRuntimeReady(getTmapv3())`만 검사(DOM 컨테이너 체크는 기존에도 없었음).

#### `course-detail/index.tsx`, `track-detail/index.tsx`, `courses-submit/index.tsx`, `tracks-submit/index.tsx`

`checkReady`는 SDK + `document.getElementById(mapContainerId)` 둘 다 검사. 나머지 지도 생성/정리 로직은 변경 없음.

### 에러 오버레이 UI

각 컴포넌트의 지도 컨테이너 `<div>` 위에 절대 위치로 겹치는 오버레이를 조건부 렌더링한다.

```tsx
<div id={mapContainerId} className={styles.map} />
{status === 'timeout' && (
  <div className={styles.mapErrorOverlay}>
    <p className={styles.mapErrorMessage}>지도를 불러올 수 없습니다</p>
    <button type="button" className={styles.mapErrorRetryButton} onClick={retry}>
      다시 시도
    </button>
  </div>
)}
```

스타일은 각 컴포넌트의 기존 `.module.css`(또는 `styles.module.css`)에 `mapErrorOverlay`/`mapErrorMessage`/`mapErrorRetryButton` 클래스를 추가한다 (인라인 스타일 금지 컨벤션 준수). 5곳 모두 같은 시각 디자인(중앙 정렬, 반투명 또는 단색 배경, 텍스트 + 버튼)을 쓰되, 각자의 CSS Modules 파일에 동일한 규칙을 복붙한다 — 공유 컴포넌트로 추출하지 않는다(5곳 다 레이아웃 컨테이너 구조가 달라서 공유 컴포넌트보다 클래스 복붙이 더 단순함).

### 변경하지 않는 것

- `SDK_READY_RETRY_DELAY_MS = 120`(polling 간격) — 그대로 유지, 훅 내부 상수로 이동.
- 각 컴포넌트의 지도 초기화 이후 로직(마커, 폴리라인, fitBounds, 클러스터링 등) — 전혀 손대지 않음.
- `(with-map)/layout.tsx`의 `document.write` 하이재킹 — SDK 스크립트 자체 로드 실패도 결국 "5초 안에 SDK 전역이 안 생긴다"로 동일하게 감지되므로 별도 처리 불필요.

## 동작 시나리오

| 상황 | 결과 |
|------|------|
| SDK가 1초 안에 준비됨 | 평소처럼 지도 정상 표시, 오버레이 없음 |
| SDK가 5초 넘게 안 준비됨 | "지도를 불러올 수 없습니다" + "다시 시도" 버튼 표시 |
| "다시 시도" 클릭 | 타임아웃 해제, 5초 데드라인 재시작하며 polling 재개 |
| home에서 생성자 race 발생 | 사용자에게 보이지 않게 내부적으로 재시도, 보통 다음 polling에서 해소 |
