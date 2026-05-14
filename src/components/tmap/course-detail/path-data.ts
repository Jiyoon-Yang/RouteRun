export type { LatLng, WaypointMarkerModel } from '@/commons/utils/route/path-parser';

export {
  extractSavedRoutePoints,
  extractPathCoordinates,
  dedupeConsecutiveCoordinates,
  buildWaypointMarkerModels,
  sanitizeDomIdSegment,
} from '@/commons/utils/route/path-parser';
