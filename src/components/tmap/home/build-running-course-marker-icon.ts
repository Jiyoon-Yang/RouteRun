import type { DistanceCategory } from '@/components/home/utils/course-filter';

export type MarkerVisualState = 'default' | 'hover' | 'clicked';

const MARKER_COLOR_BY_CATEGORY: Record<DistanceCategory, string> = {
  UNDER_3: '#3B82F6',
  BETWEEN_3_AND_5: '#16A34A',
  BETWEEN_5_AND_10: '#EF4444',
  OVER_10: '#F59E0B',
};

const MARKER_SIZE_BY_STATE: Record<MarkerVisualState, number> = {
  default: 1,
  hover: 1.08,
  clicked: 1.22,
};

function toSvgDataUrl(svgMarkup: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;
}

function buildRunningCourseMarkerSvg(color: string, state: MarkerVisualState): string {
  const scale = MARKER_SIZE_BY_STATE[state];
  const stroke = state === 'clicked' ? '#111827' : '#1F2937';
  const strokeWidth = state === 'clicked' ? 2.25 : 1.75;
  const ringOpacity = state === 'default' ? 0.18 : state === 'hover' ? 0.3 : 0.42;

  /* 코스 마커 아이콘 SVG 마크업 */
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <defs>
    <filter id="markerShadow" x="-40%" y="-35%" width="180%" height="210%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
  </defs>
  <g transform="translate(20 23) scale(${scale}) translate(-18 -20)" filter="url(#markerShadow)">
    <path d="M18 2C11.37 2 6 7.37 6 14c0 9.04 10.37 17.6 11.17 18.24.48.38 1.18.38 1.66 0C19.63 31.6 30 23.04 30 14 30 7.37 24.63 2 18 2z" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
    <circle cx="18" cy="14" r="6.2" fill="#fafafa"/>
    <circle cx="18" cy="14" r="8.9" fill="none" stroke="#fafafa" stroke-opacity="${ringOpacity}" stroke-width="1.3"/>
  </g>
</svg>
`.trim();
}

export function getRunningCourseMarkerIconUrlForCategory(
  category: DistanceCategory,
  state: MarkerVisualState,
): string {
  const color = MARKER_COLOR_BY_CATEGORY[category];
  return toSvgDataUrl(buildRunningCourseMarkerSvg(color, state));
}
