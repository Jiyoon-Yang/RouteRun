import type { Route } from '@/commons/types/runroute';

export type DistanceCategory = 'UNDER_3' | 'BETWEEN_3_AND_5' | 'BETWEEN_5_AND_10' | 'OVER_10';

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
