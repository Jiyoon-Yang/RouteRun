// 한 번에 숨기거나 해제할 수 있는 글 수. id를 URL(`.in()`)에 실어 보내서 너무 많으면 길이 한계에 걸린다.
// 사진 삭제도 같은 수까지 한 번에 받는다(글마다 차례로 처리해서 많으면 오래 걸린다).
export const MAX_BULK_CONTENT = 100

// 숨김·사진 삭제 사유 최대 길이. 확인창 입력 제한과 Action 검증이 같이 쓴다.
export const MAX_REASON = 200

// 코스·트랙 관리 목록 한 페이지에 DB에서 받아오는 글 수.
export const CONTENT_PAGE_SIZE = 20

// 이미지 검수 한 페이지에 보여 주는 사진 수.
export const IMAGE_PAGE_SIZE = 20

// 지역 필터 권역. start_address_region 첫 단어(시·도)로 묶고, 통합·개명 전후 이름을 같이 둔다.
// shortcut: 새 시·도 이름(통합·개명)이 생기면 여기에 추가해야 한다. 빠지면 그 글은 "모든 지역"에서만 보인다
export const REGION_GROUPS = [
  { label: "서울", prefixes: ["서울특별시"] },
  { label: "경기·인천", prefixes: ["경기도", "인천광역시"] },
  { label: "강원", prefixes: ["강원특별자치도", "강원도"] },
  {
    label: "충청",
    prefixes: ["대전광역시", "세종특별자치시", "충청북도", "충청남도"],
  },
  {
    label: "전라",
    prefixes: [
      "광주광역시",
      "전남광주통합특별시",
      "전라남도",
      "전북특별자치도",
      "전라북도",
    ],
  },
  {
    label: "경상",
    prefixes: [
      "부산광역시",
      "대구광역시",
      "울산광역시",
      "경상북도",
      "경상남도",
    ],
  },
  { label: "제주", prefixes: ["제주특별자치도"] },
]
