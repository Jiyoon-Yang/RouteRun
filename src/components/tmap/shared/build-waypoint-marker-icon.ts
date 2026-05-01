/**
 * 코스 등록·상세 지도에서 출발(S)·경유·도착(E) 핀 마커 아이콘을 생성한다.
 */

export type WaypointMarkerRole = 'start' | 'via' | 'end';

function markerTitleByRole(role: WaypointMarkerRole): string {
  if (role === 'start') return '출발지';
  if (role === 'end') return '도착지';
  return '경유지';
}

function markerColorByRole(role: WaypointMarkerRole): string {
  if (role === 'start') return '#16A34A';
  if (role === 'end') return '#DC2626';
  return '#2563EB';
}

/** 디자인 기준 34×44(viewBox). 표시 크기는 짝수(width 36)로 스케일 */
const MARKER_ICON_WIDTH = 36;
const MARKER_ICON_HEIGHT = 44;

export function buildWaypointMarkerIconUrl(role: WaypointMarkerRole, label: string): string {
  const color = markerColorByRole(role);
  const textColor = '#FFFFFF';
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_ICON_WIDTH}" height="${MARKER_ICON_HEIGHT}" viewBox="0 0 34 44">
  <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 27 17 27s17-14.25 17-27C34 7.611 26.389 0 17 0z" fill="${color}"/>
  <text x="17" y="21" text-anchor="middle" font-size="12" font-weight="700" fill="${textColor}" font-family="Arial, sans-serif">${label}</text>
</svg>
`.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getWaypointMarkerTitle(role: WaypointMarkerRole): string {
  return markerTitleByRole(role);
}

export const WAYPOINT_MARKER_ICON_SIZE = {
  width: MARKER_ICON_WIDTH,
  height: MARKER_ICON_HEIGHT,
} as const;
