import type { DistanceCategory } from '@/commons/utils/distance/category';

export type MarkerVisualState = 'default' | 'hover' | 'clicked';

/** 원본 144×200 PNG를 공식 예제 핀과 비슷한 스케일로 표시 (비율 유지 48×66) */
export const ROUTE_MARKER_ICON_DISPLAY_SIZE = {
  width: 48,
  height: 66,
} as const;

const CATEGORY_TO_ICON_PATH: Record<DistanceCategory, string> = {
  UNDER_3: '/assets/icons/courses-marker/marker_blue.png',
  BETWEEN_3_AND_5: '/assets/icons/courses-marker/marker_green.png',
  BETWEEN_5_AND_10: '/assets/icons/courses-marker/marker_red.png',
  OVER_10: '/assets/icons/courses-marker/marker_orange.png',
  TRACK: '/assets/icons/courses-marker/marker_gray.png',
};

/**
 * 거리 카테고리별 마커 PNG.
 * `visualState`는 호출부 시그니처 호환용이며, 아이콘 경로는 카테고리만으로 결정된다.
 * 클릭·호버 구분은 `syncRouteMarkerDomVisualState` + CSS(`data-route-marker-visual`)로 처리한다.
 */
export function getRunningCourseMarkerIconUrlForCategory(
  category: DistanceCategory,
  _visualState?: MarkerVisualState,
): string {
  return CATEGORY_TO_ICON_PATH[category];
}
