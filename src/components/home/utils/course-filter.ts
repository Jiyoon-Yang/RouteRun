import type { CourseCardView, ReferenceLocation, Route } from '@/commons/types/runroute';
import {
  calculateLinearDistanceMeters,
  hasValidRouteStartCoordinate,
  SEOUL_CITY_HALL_REFERENCE as DEFAULT_REFERENCE,
} from '@/commons/utils/geo';

export type DistanceCategory = 'UNDER_3' | 'BETWEEN_3_AND_5' | 'BETWEEN_5_AND_10' | 'OVER_10';
export const SEOUL_CITY_HALL_REFERENCE = DEFAULT_REFERENCE;

export function getDistanceCategory(distanceMeters: number): DistanceCategory {
  const distanceKm = distanceMeters / 1000;

  if (distanceKm <= 3) return 'UNDER_3';
  if (distanceKm <= 5) return 'BETWEEN_3_AND_5';
  if (distanceKm <= 10) return 'BETWEEN_5_AND_10';
  return 'OVER_10';
}

export function dedupeRoutesById(routes: Route[]): Route[] {
  const deduped = new Map<string, Route>();
  for (const route of routes) {
    deduped.set(route.id, route);
  }
  return Array.from(deduped.values());
}

export function filterRoutesByCategories(
  routes: Route[],
  selectedCategories: Set<DistanceCategory>,
): Route[] {
  const dedupedRoutes = dedupeRoutesById(routes);

  if (selectedCategories.size === 0) {
    return dedupedRoutes;
  }

  return dedupedRoutes.filter((route) => {
    if (!Number.isFinite(route.distance_meters) || route.distance_meters < 0) {
      return false;
    }

    return selectedCategories.has(getDistanceCategory(route.distance_meters));
  });
}

function toDistanceText(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

function toLocationText(route: Route): string {
  return `시작 좌표 ${route.start_lat.toFixed(4)}, ${route.start_lng.toFixed(4)}`;
}

export function pinToTopIfVisible(
  cards: CourseCardView[],
  selectedCourseId: string | null,
): CourseCardView[] {
  if (!selectedCourseId) {
    return cards.map((card) => ({ ...card, isPinnedTop: false }));
  }

  const index = cards.findIndex((card) => card.courseId === selectedCourseId);
  if (index < 0) {
    return cards.map((card) => ({ ...card, isPinnedTop: false }));
  }

  const pinned = { ...cards[index], isPinnedTop: true };
  const rest = cards
    .filter((_, cardIndex) => cardIndex !== index)
    .map((card) => ({ ...card, isPinnedTop: false }));

  return [pinned, ...rest];
}

export function buildCourseCardViews(
  routes: Route[],
  referenceLocation: ReferenceLocation,
  selectedCourseId: string | null,
): CourseCardView[] {
  const baseCards = dedupeRoutesById(routes)
    .filter(hasValidRouteStartCoordinate)
    .map((route) => {
      const distanceFromReference = calculateLinearDistanceMeters(referenceLocation, {
        lat: route.start_lat,
        lng: route.start_lng,
      });
      return {
        courseId: route.id,
        title: route.title,
        location: toLocationText(route),
        distanceKm: route.distance_meters / 1000,
        distanceFromReference,
        distanceText: toDistanceText(route.distance_meters),
        isPinnedTop: false,
      };
    })
    .sort((left, right) => {
      if (left.distanceFromReference !== right.distanceFromReference) {
        return left.distanceFromReference - right.distanceFromReference;
      }

      return left.title.localeCompare(right.title, 'ko');
    });

  return pinToTopIfVisible(baseCards, selectedCourseId);
}
