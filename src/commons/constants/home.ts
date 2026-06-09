import type { DistanceCategory } from '@/commons/utils/distance/category';

export const TAB_ITEMS = [
  { label: '~3km', variant: 'blue' as const, category: 'UNDER_3' as const },
  { label: '3~5km', variant: 'green' as const, category: 'BETWEEN_3_AND_5' as const },
  { label: '5~10km', variant: 'red' as const, category: 'BETWEEN_5_AND_10' as const },
  { label: '10km~', variant: 'orange' as const, category: 'OVER_10' as const },
  { label: '트랙', variant: 'gray' as const, category: 'TRACK' as const },
] as const satisfies ReadonlyArray<{
  label: string;
  variant: 'blue' | 'green' | 'red' | 'orange' | 'gray';
  category: DistanceCategory;
}>;

export const HOME_QUERY_KEYS = {
  categories: 'categories',
  sheet: 'sheet',
} as const;

export const HOME_SESSION_KEYS = {
  savedViewport: 'homeSavedViewport',
  restoreViewportOnce: 'homeRestoreViewportOnce',
  restoreSelectedFocusOnce: 'homeRestoreSelectedFocusOnce',
  savedCourseId: 'homeSavedCourseId',
  savedTrackId: 'homeSavedTrackId',
} as const;
