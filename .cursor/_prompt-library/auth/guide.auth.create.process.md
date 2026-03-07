# Auth 프롬프트 실행 가이드

이 문서는 `docs/auth`의 프롬프트 파일을 어떤 순서로 사용해야 하는지, 그리고 실제로 어떻게 입력해서 사용하는지 설명합니다.

## 1) 권장 생성 순서

1. `prompt.101.initialize.txt`  
2. `prompt.102.auth.txt`  
3. `prompt.201.api-login.txt`  
4. `prompt.202.api-logout.txt`  
5. `prompt.301.auth-provider.txt`  
6. `prompt.302-1.hook-google-login.txt`  
7. `prompt.302-2.hook-kakao-login.txt`  
8. `prompt.401.app-wiring.txt`  

## 2) 왜 이 순서인가

- `101`에서 Supabase 초기화 유틸을 먼저 만든 뒤
- `102/201/202`가 그 유틸을 가져다 사용하고
- `301/302`가 API를 호출하는 클라이언트 상태/훅을 만들고
- 마지막 `401`에서 앱 전체에 연결하는 구조이기 때문입니다.

## 3) 프롬프트 사용 방법 (권장)

- 한 번에 하나의 프롬프트만 사용
- 이전 단계 결과를 확인한 뒤 다음 단계 진행
- 수정이 필요한 경우 반드시 프롬프트 원문 하위에 수정 사항을 추가할 것.

## 4) 검수 체크리스트 (빠른 확인용)

- `initialize`: 기본/관리자 싱글톤 노출, 토큰 기반은 함수만 노출
- `auth`: Bearer 검증 + userId 반환/전체 user 반환 흐름 존재
- `api-login`: GET/POST 단일 엔드포인트 + OAuth URL 리다이렉트 흐름 존재
- `api-logout`: POST only + Bearer 기준 로그아웃 + 같은 요청을 여러 번 보내도 결과가 같게 처리
- `provider/hooks/wiring`: Supabase SDK 직접 호출 없이 API 중심으로 연결

## 5) 파일별 역할 요약

- `prompt.101.initialize.txt`: Supabase 클라이언트 생성 규칙의 기준 파일(기본/토큰/관리자 분리)
- `prompt.102.auth.txt`: API 인가 공통 유틸(헤더 검증, 사용자 식별, 공통 에러 처리)
- `prompt.201.api-login.txt`: OAuth 로그인 시작/콜백 처리 및 브라우저 토큰 반영 흐름
- `prompt.202.api-logout.txt`: 로그아웃 API 처리(POST + Bearer 기준, 반복 호출에도 안정적 처리)
- `prompt.301.auth-provider.txt`: 클라이언트 인증 상태 저장/복원/초기화 담당
- `prompt.302-1.hook-google-login.txt`: 구글 로그인 시작 API 호출 훅
- `prompt.302-2.hook-kakao-login.txt`: 카카오 로그인 시작 API 호출 훅
- `prompt.401.app-wiring.txt`: AuthProvider를 앱 전역에 연결하는 최종 배치 단계

## 6) 자주 나는 실수
- Supabase `createClient`를 API 파일/훅 파일에서 직접 생성
- 한 번에 여러 프롬프트를 넣어 출력이 섞임
