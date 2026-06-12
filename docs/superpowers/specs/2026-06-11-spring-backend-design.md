# Spring 백엔드 도입 설계

**작성일:** 2026-06-11  
**목적:** REST API 경험을 쌓기 위해 Java Spring 백엔드를 도입한다.

---

## 1. 목표

- Next.js Server Actions를 Spring REST API 호출로 교체한다.
- Spring Security로 Supabase JWT를 검증해 인증을 처리한다.
- REST API + JWT 인증 패턴을 직접 구현하며 학습한다.

---

## 2. 전체 아키텍처

```
[Next.js 14 - 프론트엔드]
  ↓ fetch (Authorization: Bearer <Supabase JWT>)
[Spring Boot REST API - :8080]
  ├── Spring Security (Supabase JWT 검증)
  ├── Controller → Service → Repository (JPA)
  └── 비즈니스 로직 처리
        ↓
[Supabase PostgreSQL]
  (users, routes, route_likes, tracks, track_likes 테이블 그대로 사용)
```

**인증 흐름:**
1. 사용자가 Next.js에서 Supabase Auth로 로그인 (Google OAuth / 익명)
2. Supabase가 JWT 발급
3. Next.js가 Spring API 호출 시 `Authorization: Bearer <JWT>` 헤더 포함
4. Spring Security가 Supabase JWT 서명 검증 후 요청 처리

**변경되는 것:**
- Next.js Server Actions → Spring REST API `fetch` 호출로 교체
- `src/repositories/`, `src/services/`, `src/actions/` → `src/api/` 폴더로 대체

**그대로 유지되는 것:**
- Supabase Auth (Google OAuth + 익명 로그인)
- Supabase PostgreSQL DB 스키마
- Next.js 프론트엔드 컴포넌트 UI
- TMap SDK (클라이언트 사이드)

---

## 3. 프로젝트 구조

Spring Boot 프로젝트는 별도 폴더로 분리하며, 추후 독립 레포로 이전 가능하다.

```
running-course-server/
├── src/main/java/com/runningcourse/
│   ├── course/
│   │   ├── controller/   CourseController.java
│   │   ├── service/      CourseService.java
│   │   ├── repository/   CourseRepository.java  (JPA)
│   │   ├── entity/       Course.java
│   │   └── dto/          CourseRequest.java, CourseResponse.java
│   ├── track/            (course와 동일 구조)
│   ├── user/             (프로필, 마이페이지)
│   ├── report/           (신고)
│   └── config/
│       ├── SecurityConfig.java   (Supabase JWT 검증)
│       └── CorsConfig.java       (localhost:3000 허용)
└── src/main/resources/
    └── application.yml   (Supabase DB URL, JWT Secret)
```

**기술 스택:**
- Spring Boot 3.x + Java 17
- Spring Security 6 (JWT 검증)
- Spring Data JPA + Hibernate
- PostgreSQL Driver

---

## 4. REST API 엔드포인트

### 코스

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/courses` | 목록 조회 (홈 피드) | 불필요 |
| GET | `/api/courses/{id}` | 상세 조회 (`isLiked` 포함) | 선택 |
| POST | `/api/courses` | 생성 | 필요 |
| PATCH | `/api/courses/{id}` | 수정 (본인만) | 필요 |
| DELETE | `/api/courses/{id}` | 삭제 (본인만) | 필요 |
| POST | `/api/courses/{id}/like` | 좋아요 | 필요 |
| DELETE | `/api/courses/{id}/like` | 좋아요 취소 | 필요 |

### 트랙

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/tracks` | 목록 조회 | 불필요 |
| GET | `/api/tracks/{id}` | 상세 조회 (`isLiked` 포함) | 선택 |
| POST | `/api/tracks` | 생성 | 필요 |
| PATCH | `/api/tracks/{id}` | 수정 (본인만) | 필요 |
| DELETE | `/api/tracks/{id}` | 삭제 (본인만) | 필요 |
| POST | `/api/tracks/{id}/like` | 좋아요 | 필요 |
| DELETE | `/api/tracks/{id}/like` | 좋아요 취소 | 필요 |

### 유저

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/users/me` | 내 프로필 | 필요 |
| PATCH | `/api/users/me` | 닉네임 수정 | 필요 |
| GET | `/api/users/me/courses` | 내가 등록한 코스 목록 | 필요 |
| GET | `/api/users/me/liked-courses` | 내가 좋아요한 코스 목록 | 필요 |
| GET | `/api/users/me/tracks` | 내가 등록한 트랙 목록 | 필요 |
| GET | `/api/users/me/liked-tracks` | 내가 좋아요한 트랙 목록 | 필요 |
| GET | `/api/users/nickname/check?nickname=xxx` | 닉네임 중복 확인 | 필요 |

### 신고

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/reports` | 신고 제출 | 필요 |

---

## 5. 주요 설계 결정

### 이미지 업로드
프론트에서 직접 Supabase Storage(`course_images` 버킷)에 업로드하고, URL 문자열만 Spring API로 전달한다. Spring은 이미지 파일을 직접 처리하지 않는다.

### 역지오코딩
코스/트랙 등록 시 좌표 → 지역명 변환은 프론트에서 TMap API를 직접 호출한다. 변환된 `start_address_region` 문자열을 Spring API에 함께 전달한다.

### `isLiked` 계산
`GET /api/courses/{id}`, `GET /api/tracks/{id}` 응답에 `isLiked` 필드를 포함한다. `route_likes` / `track_likes` 테이블에서 현재 사용자 ID와 리소스 ID의 행 존재 여부로 계산한다. 비로그인 상태면 `isLiked: false`를 반환한다.

### 좋아요 HTTP 메서드
`POST` = 좋아요 추가, `DELETE` = 좋아요 취소로 HTTP 메서드의 의미를 명확히 구분한다.

### 수정 메서드
부분 수정이므로 `PUT` 대신 `PATCH`를 사용한다. 변경할 필드만 요청 바디에 포함한다.

---

## 6. Next.js 변경사항

```
src/
├── api/                  ← 신규 (Spring API 호출 함수)
│   ├── course.api.ts
│   ├── track.api.ts
│   ├── user.api.ts
│   └── report.api.ts
├── actions/              ← 제거 (Server Actions 불필요)
├── repositories/         ← 제거 (Supabase 직접 호출 제거)
└── services/             ← 제거 (Spring이 담당)
```

JWT는 `httpOnly` 쿠키에 저장해 XSS를 방어한다.

---

## 7. 환경 변수 추가 (Spring)

```yaml
# application.yml
spring:
  datasource:
    url: ${SUPABASE_DB_URL}
    username: ${SUPABASE_DB_USER}
    password: ${SUPABASE_DB_PASSWORD}

supabase:
  jwt-secret: ${SUPABASE_JWT_SECRET}
```
