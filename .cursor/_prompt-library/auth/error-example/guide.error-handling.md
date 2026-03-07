# 에러 처리 가이드 (error-example)

이 문서는 아래 3개 파일이 각각 무엇을 하는지, 어떻게 함께 쓰는지 설명합니다.

- `docs/error-example/api-error-codes.ts`
- `docs/error-example/api-error.ts`
- `docs/error-example/api-client-error.ts`

## 한눈에 보기

- `api-error-codes.ts`: 에러 코드 상수 모음 (코드 표준)
- `api-error.ts`: 서버 응답 포맷 통일 (API 라우트에서 사용)
- `api-client-error.ts`: 클라이언트 에러 파싱 통일 (훅/컴포넌트에서 사용)

## 1) `api-error-codes.ts`

### 역할
- 공통 에러 코드 문자열을 한곳에서 관리합니다.
- 서버/클라이언트가 같은 코드를 쓰게 만들어 오타와 불일치를 줄입니다.

### 핵심 포인트
- `COMMON_API_ERROR_CODES` 상수 제공
- `CommonApiErrorCode` 타입 제공

## 2) `api-error.ts`

### 역할
- 서버(Next API route)에서 에러 응답 모양을 통일합니다.

### 핵심 포인트
- 표준 형태:
  - `{ success: false, error: { code, message } }`
- 자주 쓰는 헬퍼:
  - `respondMethodNotAllowed`
  - `respondInvalidRequest`
  - `respondInternalError`
- 인증 에러 변환:
  - `tryRespondAuthError`로 `AuthError`를 401 응답으로 변환

## 3) `api-client-error.ts`

### 역할
- 클라이언트에서 다양한 서버 에러 바디를 하나의 형태로 읽어냅니다.

### 핵심 포인트
- 표준/레거시 응답을 우선순위로 파싱
- `ApiClientError` 클래스로 통일
- `buildApiClientError`, `getApiErrorMessage` 제공

## 실제 흐름

1. 서버에서 `api-error.ts` 헬퍼로 에러 응답을 반환  
2. 클라이언트에서 `api-client-error.ts`로 응답을 파싱  
3. UI는 코드/메시지 기준으로 분기 처리  
4. 공통 코드 값은 `api-error-codes.ts` 기준으로 맞춤

## 짧은 사용 예시

### 서버 예시

```ts
import { respondInvalidRequest } from '@/commons/libraries/api-error';

if (!req.body?.keyword) {
  return respondInvalidRequest(res, 'keyword가 필요합니다.');
}
```

### 클라이언트 예시

```ts
import { buildApiClientError } from '@/commons/libraries/api-client-error';

if (!response.ok) {
  const body = await response.json().catch(() => null);
  throw buildApiClientError(body, '요청 처리 중 오류가 발생했습니다.');
}
```

## 왜 이렇게 나누나

- 코드 관리가 쉬워집니다.
- 서버 응답 모양이 바뀌어도, 클라이언트 수정 범위를 줄일 수 있습니다.
- 에러 처리 규칙을 팀 단위로 일관되게 유지할 수 있습니다.
