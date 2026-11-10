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
│   ├── components/<이름>/    공용 컴포넌트 (route-preview, search-input, status-badge)
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

화면은 2026-11-04에 시안 A/B 중에서 확정했다. 데이터는 아직 전부 `commons/mocks` 목데이터다. 로그인은 Supabase 대시보드에서 만든 이메일 계정 중 `admins`에 등록된 계정만 통과한다.

| 화면 | 경로 | 고른 시안 | 연결에 필요한 DB 변경 |
| --- | --- | --- | --- |
| 관리자 로그인 | `/login` | 중앙 카드 | `admins` 테이블 |
| 대시보드 | `/` | 지표 중심 | 없음 |
| 제보 처리함 | `/reports` | 메일함 2단 | `reports.status`, `admin_note`, `handled_at` |
| 코스·트랙 관리 | `/content` | 데이터 테이블 | `routes`·`tracks`.`is_hidden` + 사용자 앱 조회 필터 |
| 유저 관리 | `/users` | 목록 + 프로필 패널 | `users.suspended_until`, `suspend_reason` |
| 공지 관리 | `/notices` | 목록 + 작성 다이얼로그 | `notices` 테이블 |
| 이미지 검수 | `/images` | 갤러리 그리드 | 없음 |
| 작업 기록 | `/audit` | 필터 테이블 | `admin_logs` 테이블 |

## 주의

- 레포 루트 `.gitignore`의 `logs` 규칙이 하위 폴더 이름까지 무시한다. 그래서 작업 기록 라우트는 `logs`가 아니라 `audit`이다. 새 폴더 이름이 루트 `.gitignore`에 걸리지 않는지 확인할 것 (`git check-ignore -v <경로>`). 걸리면 git에도 안 올라가고 Tailwind도 스캔하지 않는다.
- 루트에도 `package-lock.json`이 있어서 `next.config.ts`의 `turbopack.root`로 이 폴더를 루트로 고정했다. 빼면 사용자 앱 `middleware.ts`까지 빌드하려다 깨진다.
- 루트 `tsconfig.json`은 `admin`을 exclude한다. 사용자 앱 타입체크·빌드에 admin이 섞이지 않게.
- `d` 키는 테마 전환 단축키(`commons/providers/theme`)라 다른 단축키로 쓰지 않는다.
