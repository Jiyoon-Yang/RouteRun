# 기능: Supabase 테이블 형식 변환

지도에서 수집한 `points`(위도·경도 배열)를, Supabase 코스 포인트 테이블에 넣을 수 있는 행(row) 배열로 바꾸는 로직을 설명합니다.

---

## 1. 목적

- **실제 insert는 하지 않음**: 이 테스트 페이지에서는 DB에 저장하지 않고, **어떤 형태로 넣을지**만 확인합니다.
- **용도**: API 응답 구조·컬럼 매핑을 파악하고, 나중에 실제 저장 로직을 붙일 때 참고하기 위함입니다.

---

## 2. 테이블 구조(목표)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | 자동 생성 → insert 시 제외 |
| course_id | uuid | 코스 하나를 구분하는 ID |
| point_type | text | START / WAYPOINT / END |
| latitude | float8 | 위도 |
| longitude | float8 | 경도 |
| sequence | int4 | 클릭 순서(1부터) |

---

## 3. 변환 규칙

- **point_type**  
  - **첫 번째 점**(sequence 1) → `"START"`  
  - **마지막 점**(sequence === points.length) → `"END"`  
  - **그 사이** → `"WAYPOINT"`

- **sequence**  
  - 배열 인덱스 + 1 (1, 2, 3, …)

- **course_id**  
  - 인자로 받은 값 사용. 테스트에서는 `crypto.randomUUID()` 또는 고정 문자열을 씁니다. 실제로는 “코스 생성” 후 받은 uuid 를 넘기면 됩니다.

- **id**  
  - DB에서 자동 생성하므로, 변환 결과 객체에는 넣지 않습니다.

---

## 4. 함수: toSupabaseCoursePoints

- **위치**: `MapTest.tsx` 내부(또는 동일 파일 상단).
- **시그니처**:  
  `toSupabaseCoursePoints(courseId: string, points: ClickPoint[]): SupabaseCoursePointRow[]`
- **동작**:  
  - `points` 를 순회하면서 각 요소에 대해 `sequence`, `point_type` 을 위 규칙대로 정한 뒤,  
  - `{ course_id, point_type, latitude, longitude, sequence }` 형태의 객체를 만들어 배열로 반환합니다.

**반환 타입 예시** (`SupabaseCoursePointRow`):

- `course_id: string`
- `point_type: "START" | "WAYPOINT" | "END"`
- `latitude: number`
- `longitude: number`
- `sequence: number`

---

## 5. 사용처

- **화면**: 변환 결과 배열을 이용해 “클릭한 좌표 목록”을 sequence·point_type·위도·경도로 렌더링합니다.
- **콘솔**: `points`(또는 `courseId`)가 바뀔 때마다 `toSupabaseCoursePoints(courseId, points)` 결과를 `console.log` 로 출력해, 실제 저장 시 넘길 데이터 형태를 확인할 수 있습니다.

---

## 6. 요약

| 입력 | 출력 |
|------|------|
| `courseId` + `points`(클릭 순서 배열) | `{ course_id, point_type, latitude, longitude, sequence }[]` |

- point_type 은 **순서**로만 결정 (첫 번째=START, 마지막=END, 나머지=WAYPOINT).
- id 는 제외하고, 실제 insert 시에는 Supabase가 생성하도록 두면 됩니다.
