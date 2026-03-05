<<<<<<< HEAD
# RunningCourse

# 🏃 Running Course Share

사용자가 직접 러닝 코스를 등록하고 공유할 수 있는  
**위치 기반 러닝 코스 커뮤니티 서비스**입니다.

단순 CRUD 구현을 넘어서  
**실제 사용자 서비스 흐름과 정보 구조(IA)를 기반으로 설계된 End-to-End 프로젝트**입니다.

---

# 🚀 Project Goal

## Why

단순 CRUD 기능 구현을 넘어  
**실제 서비스에서 필요한 사용자 흐름 전체를 경험하기 위해 시작한 프로젝트**입니다.

- 인증 기반 사용자 데이터 관리
- 지도 기반 위치 서비스 구현
- 사용자 생성 콘텐츠 (UGC) 구조 설계
- 실제 서비스 흐름 기반 UI/UX 설계
- 배포까지 포함한 End-to-End 개발 경험

---

## What We Learn

- 인증 기반 데이터 구조 설계
- 사용자별 데이터 관리
- 지도 API 연동
- Frontend + Backend 통합 개발
- 서비스 배포 경험

---

# 🧭 Information Architecture (IA)
 / → 홈 (지도 탐색)
├─ /courses/[id] → 코스 상세
├─ /courses/new → 코스 등록
├─ /mypage → 마이페이지
├─ /login → 로그인
└─ /signup → 회원가입

Depth: 최대 2

모바일 웹 기준으로 **단순하고 직관적인 네비게이션 구조**를 목표로 설계했습니다.

---

# 📱 Navigation Structure

하단 고정 네비게이션 3개 탭

- 🗺 홈
- ✍ 코스 등록
- 👤 마이페이지

모바일 환경에서 **한 손 조작을 고려한 구조**입니다.

---

# 🧊 User Flow

### 🔹 탐색 흐름
홈
↓
지도 마커 클릭
↓
바텀시트 정보 확인
↓
코스 상세 페이지
↓
좋아요


### 🔹 생성 흐름
로그인
↓
코스 등록
↓
코스 상세 페이지 이동


### 🔹 관리 흐름
마이페이지
↓
내가 작성한 코스
↓
수정 / 삭제


---

# 🛠 Tech Stack

## Frontend

- Next.js
- Tailwind CSS

## Backend

Supabase

- Authentication
- PostgreSQL Database
- Storage

## Map

- Kakao Maps API  
또는
- Google Maps API

## Deploy

- Vercel

---

# 🗺 Pages & Features

---

## 🗺 Home (/)

### 목적

내 주변 러닝 코스를 탐색하는 **서비스 메인 허브**

### 구성

- 현재 위치 표시
- 거리 필터 (3km / 5km / 10km)
- 지도 영역
- 러닝 코스 마커 표시
- 마커 클릭 시 바텀시트 표시

### 바텀시트 정보

- 코스 썸네일
- 코스명
- 총 거리
- 좋아요 수
- 상세 보기 버튼

### 핵심 UX

지도 중심 탐색 → 마커 선택 → 상세 페이지 이동

---

## 📍 Course Detail (/courses/[id])

### 목적

코스 정보 확인 및 사용자 상호작용

### 구성

- 지도 (Polyline 표시)
- 코스명
- 총 거리
- 좋아요 수
- 코스 이미지
- 설명
- 하단 고정 좋아요 버튼

---

## ✍ Course Create (/courses/new)

### 목적

지도 기반 러닝 코스 생성

### 지도 기능

- 지도 클릭 → 좌표 생성
- 좌표 자동 연결 (Polyline)
- 마지막 점 삭제
- 전체 초기화

### 입력 영역

- 코스명 (필수)
- 설명 (선택)
- 이미지 업로드 (선택)

### 등록 조건

- 좌표 2개 이상
- 코스명 입력

등록 완료 시 → 코스 상세 페이지 이동

---

## 👤 My Page (/mypage)

### 목적

사용자 데이터 관리

### 구성

- 사용자 프로필
- 내가 작성한 코스 목록

### 기능

- 코스 수정
- 코스 삭제

좋아요 목록은 **2차 확장 기능으로 계획**

---

## 🔐 Login / Signup

### 구성

- 이메일
- 비밀번호

### 특징

- 소셜 로그인 없음
- 최소한의 개인정보 구조

---

# 🗄 Database Design

## users

| column | type |
|------|------|
| id | uuid |
| email | text |

---

## courses

| column | type |
|------|------|
| id | uuid |
| title | text |
| description | text |
| distance | float |
| image_url | text |
| coordinates | json |
| user_id | uuid |
| created_at | timestamp |

---

## likes

| column | type |
|------|------|
| id | uuid |
| user_id | uuid |
| course_id | uuid |
| created_at | timestamp |

---

# 🚀 Development Strategy

## Phase 1 (MVP)

- 인증 시스템
- 코스 등록
- 코스 목록 / 상세

---

## Phase 2

- 좋아요 기능
- 개인 보관함
- 내 코스 관리

---

## Phase 3

- 정렬 기능
- 거리 자동 계산
- UI 고도화

---

# 👥 Team

| Name | Role |
|-----|-----|
| 김희주 | Frontend, Backend, Supabase |
| 양지윤 | UI/UX Design, Frontend, Backend, Supabase |

---

# 📦 Deploy

서비스는 **Vercel**을 통해 배포 예정입니다.
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> b4aa45a (Initial commit from Create Next App)
