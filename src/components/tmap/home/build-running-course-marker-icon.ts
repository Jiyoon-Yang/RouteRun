import icon10KmClicked from '@/assets/icons/10Km-clicked.png';
import icon10KmDefault from '@/assets/icons/10Km-default.png';
import icon10KmHover from '@/assets/icons/10Km-hover.png';
import icon3To5KmClicked from '@/assets/icons/3-5Km-clicked.png';
import icon3To5KmDefault from '@/assets/icons/3-5Km-default.png';
import icon3To5KmHover from '@/assets/icons/3-5Km-hover.png';
import icon3KmClicked from '@/assets/icons/3Km-clicked.png';
import icon3KmDefault from '@/assets/icons/3Km-default.png';
import icon3KmHover from '@/assets/icons/3Km-hover.png';
import icon5To10KmClicked from '@/assets/icons/5~10Km-clicked.png';
import icon5To10KmDefault from '@/assets/icons/5~10Km-default.png';
import icon5To10KmHover from '@/assets/icons/5~10Km-hover.png';
import type { DistanceCategory } from '@/components/home/utils/course-filter';

export type MarkerVisualState = 'default' | 'hover' | 'clicked';

const TMAP_PIN_ICON_BY_CATEGORY: Record<DistanceCategory, Record<MarkerVisualState, string>> = {
  UNDER_3: {
    default: icon3KmDefault.src,
    hover: icon3KmHover.src,
    clicked: icon3KmClicked.src,
  },
  BETWEEN_3_AND_5: {
    default: icon3To5KmDefault.src,
    hover: icon3To5KmHover.src,
    clicked: icon3To5KmClicked.src,
  },
  BETWEEN_5_AND_10: {
    default: icon5To10KmDefault.src,
    hover: icon5To10KmHover.src,
    clicked: icon5To10KmClicked.src,
  },
  OVER_10: {
    default: icon10KmDefault.src,
    hover: icon10KmHover.src,
    clicked: icon10KmClicked.src,
  },
} as const;

export function getRunningCourseMarkerIconUrlForCategory(
  category: DistanceCategory,
  state: MarkerVisualState,
): string {
  return TMAP_PIN_ICON_BY_CATEGORY[category][state];
}
