# RunningCourse 관리자

사용자 앱(레포 루트)과 별개인 Next.js 16 + shadcn/ui(base-nova, Base UI) 앱. 데스크톱 전용.
진행 순서는 [ROADMAP.md](./ROADMAP.md).

```bash
cd admin
npm install
cp .env.example .env.local   # 값은 루트 .env.local의 Supabase URL·anon 키와 같다
npm run dev -- -p 3001   # 사용자 앱(3000)과 같이 띄울 때
npm run lint && npm run typecheck
```

## 폴더 구조

사용자 앱과 같은 규칙. 라우트는 얇게, 화면은 `components/<기능>`, 공용은 `commons/`.

```
src/
├── app/                     라우트만. page.tsx는 components/<기능>을 렌더 (데이터 조회도 여기서)
│   ├── login/
│   └── (admin)/             사이드바 레이아웃 아래 화면: / reports notices content images users audit
├── components/<기능>/        화면. index.tsx + 하위 컴포넌트 폴더(hide-dialog/ 등) + utils/
├── commons/
│   ├── components/ui/       shadcn 컴포넌트 (npx shadcn add가 여기로 설치)
│   ├── components/<이름>/    공용 컴포넌트 (search-input, status-badge)
│   ├── layout/              AdminLayout, sidebar/, header/, providers.tsx
│   ├── constants/           nav.ts(사이드바 메뉴), labels.ts(상태·유형 표시명)
│   ├── types/admin.ts       도메인 타입
│   ├── utils/format.ts      날짜·거리·숫자 표시
│   ├── hooks/               use-mobile (shadcn 생성)
│   ├── providers/theme/     다크 모드
│   └── mocks/               목데이터. 실데이터 연결이 끝나면 삭제
└── lib/utils.ts             cn. clsx + tailwind-merge 대신 `cn` 패키지(shadcn-ui/cn)를 앱 생성 때부터 사용. Node 22 이상 필요
```

데이터를 붙이면서 사용자 앱과 같은 `src/actions/`, `src/services/`, `src/repositories/`, `src/lib/supabase/`를 추가한다.
흐름도 같다: Page → Server Action → Service → Repository → Supabase.

## 화면

화면은 2026-11-04에 시안 A/B 중에서 확정했다. 대시보드·제보 처리함·공지 관리·코스·트랙 관리는 실데이터(Service Role)이고, 나머지 화면은 아직 `commons/mocks` 목데이터다. 로그인은 Supabase 대시보드에서 만든 이메일 계정 중 `admins`에 등록된 계정만 통과한다.

| 화면 | 경로 | 고른 시안 | 연결에 필요한 DB 변경 |
| --- | --- | --- | --- |
| 관리자 로그인 | `/login` | 중앙 카드 | `admins` 테이블 |
| 대시보드 | `/` | 지표 중심 | 없음 |
| 제보 처리함 | `/reports` | 메일함 2단 | `reports.status`, `admin_note`, `handled_at` |
| 코스·트랙 관리 | `/content` | 데이터 테이블 | `routes`·`tracks`.`is_hidden` + RLS SELECT 정책 |
| 유저 관리 | `/users` | 목록 + 프로필 패널 | `users.suspended_until`, `suspend_reason` |
| 공지 관리 | `/notices` | 목록 + 작성 다이얼로그 | `notices` 테이블 |
| 이미지 검수 | `/images` | 갤러리 그리드 | 없음 |
| 작업 기록 | `/audit` | 필터 테이블 | `admin_logs` 테이블 |

## 검색 유입 카드

대시보드의 "검색 유입" 카드는 Google Search Console API와 GA4 Data API를 서비스 계정으로 읽는다. 결과는 6시간 캐시한다.
카드는 대시보드를 먼저 그린 뒤 `useSearchStats` 훅 → `getSearchStatsAction` → Service → Repository 순서로 따로 불러온다. 구글 키는 서버에만 있다.
환경 변수가 하나라도 없거나 API 호출이 실패하면 카드에 안내만 나오고, 대시보드의 나머지 부분은 그대로 보인다.

1. [Google Cloud 콘솔](https://console.cloud.google.com) → API 및 서비스 → 라이브러리에서 **Google Search Console API**와 **Google Analytics Data API**를 사용 설정한다.
2. IAM 및 관리자 → 서비스 계정에서 계정을 만든다(역할은 주지 않는다). 키 → 키 추가 → JSON으로 키 파일을 받는다.
3. Search Console → 설정 → 사용자 및 권한에서 서비스 계정 이메일을 **제한됨** 권한으로 추가한다.
4. GA4 → 관리 → 속성 액세스 관리에서 서비스 계정 이메일을 **뷰어**로 추가한다.
5. 환경 변수를 넣는다. 로컬은 `.env.local`, 운영은 어드민 Vercel 프로젝트에만 넣는다.

| 변수 | 값 |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 키 JSON 전체. Vercel에는 파일 내용을 그대로 붙여넣는다. `.env.local`에는 아래 명령으로 한 줄로 넣는다 |
| `GSC_SITE_URL` | 도메인 속성이면 `sc-domain:routerun.co.kr`, URL 접두어 속성이면 `https://routerun.co.kr/` |
| `GA4_PROPERTY_ID` | GA4 → 관리 → 속성 설정의 숫자 속성 ID. `G-`로 시작하는 측정 ID가 아니다 |

```bash
# admin 폴더에서. 키 파일 경로만 바꾼다. echo는 zsh에서 \n을 줄바꿈으로 바꿔 키가 깨지니 printf를 쓴다
printf "GOOGLE_SERVICE_ACCOUNT_JSON='%s'\n" "$(node -p 'JSON.stringify(require(process.argv[1]))' ~/Downloads/키파일.json)" >> .env.local
```

키 파일은 레포 폴더에 두지 말고, Vercel에도 넣은 뒤 지운다.

네이버 서치어드바이저는 통계 API를 찾지 못해 카드에 콘솔 링크만 둔다. 네이버에서 들어온 방문은 GA4 기준(`naver / organic`)으로 "검색엔진별 방문"에 나온다. 네이버 앱 안의 브라우저에서 들어온 방문은 직접 방문으로 잡혀서 실제보다 적게 보일 수 있다.

## 주의

- 레포 루트 `.gitignore`의 `logs` 규칙이 하위 폴더 이름까지 무시한다. 그래서 작업 기록 라우트는 `logs`가 아니라 `audit`이다. 새 폴더 이름이 루트 `.gitignore`에 걸리지 않는지 확인할 것 (`git check-ignore -v <경로>`). 걸리면 git에도 안 올라가고 Tailwind도 스캔하지 않는다.
- 루트에도 `package-lock.json`이 있어서 `next.config.ts`의 `turbopack.root`로 이 폴더를 루트로 고정했다. 빼면 사용자 앱 `middleware.ts`까지 빌드하려다 깨진다.
- 루트 `tsconfig.json`은 `admin`을 exclude한다. 사용자 앱 타입체크·빌드에 admin이 섞이지 않게.
- `d` 키는 테마 전환 단축키(`commons/providers/theme`)라 다른 단축키로 쓰지 않는다.
- 로컬에서는 쿠키가 포트를 구분하지 않아 사용자 앱(3000)과 어드민(3001)이 같은 Supabase 세션 쿠키를 쓴다. 어드민에 로그인하거나 로그아웃하면 사용자 앱의 로컬 세션이 바뀐다. 운영은 도메인이 달라 상관없다.
- Server Action과 `requireAdmin()`은 Service 없이 Repository를 바로 호출해도 된다(사용자 앱의 좋아요 액션과 같은 예외). 조합이나 도메인 규칙이 생기면 Service로 뺀다.
