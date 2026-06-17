# 🏃‍♀️ RunningCourse

사용자가 직접 러닝 코스와 트랙을 등록하고 공유하는 **위치 기반 커뮤니티**입니다.  
**실제 서비스의 데이터 흐름과 사용자 경험**을 설계하는 데 집중한 프로젝트입니다.

---

## 🧭 주요 기능 및 서비스 흐름

### 📱 페이지 구성 (IA)

- **홈 (/)**: 현재 위치 기반 지도 탐색 및 **거리별 필터** (3 / 5 / 10km)
- **코스 상세**: Polyline 경로 시각화, 상세 정보 확인 및 좋아요 기능
- **코스 등록/수정**: 지도 클릭 기반 **실시간 경로 생성**, 왕복 여부 설정, 이미지 업로드
- **트랙 상세**: 러닝 장소 정보 확인 및 좋아요 기능
- **트랙 등록/수정**: 장소 정보 및 이미지 등록
- **마이페이지**: 프로필 관리, 내가 작성한 코스·트랙 목록 및 수정/삭제
- **신고**: 부적절한 코스·트랙 신고 접수
- **공지사항**: 서비스 공지 확인

### 🧊 사용자 흐름 (User Flow)

- **탐색**: 지도 마커 클릭 → 바텀시트 정보 확인 → 상세 페이지 이동
- **코스 생성**: 로그인 → 지도 클릭으로 경로 생성 → 정보 입력 → 등록 완료
- **트랙 생성**: 로그인 → 장소 정보 입력 → 등록 완료
- **게스트 탐색**: 로그인 없이 지도 탐색 가능 (코스·트랙 생성 및 좋아요는 로그인 필요)

---

## 🛠 기술 스택

| 분류 | 기술 |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, CSS Modules |
| **Map** | TMap Vector SDK |
| **Auth** | Supabase Auth (Google OAuth + 익명 세션) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Deploy** | Vercel |

---

## 🗂 데이터 흐름

```
Page/Component → Server Action → Service → Repository → Supabase
```

- **Server Actions**: 인증, 코스/트랙 CRUD, 폼 제출 등 mutation 처리
- **Repositories**: Supabase를 직접 호출하는 유일한 레이어
- **Services**: 비즈니스 로직 담당
- **Server Components**: 데이터 패칭 / Client Components: 인터랙션 상태 관리

---

## 👥 팀 구성 및 역할

| 이름       | 역할                                        |
| :--------- | :------------------------------------------ |
| **김희주** | Frontend, Backend 개발                      |
| **양지윤** | UI/UX 디자인 설계 및 Frontend, Backend 개발 |
