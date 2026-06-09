import type { TmapCoordinate, TmapLatLngLike } from '@/commons/types/tmap';

export const MAX_POINT_LENGTH = 7;

export function toCoordinate(latLng: TmapLatLngLike): TmapCoordinate | null {
  const lat =
    typeof latLng.lat === 'function'
      ? latLng.lat()
      : (latLng.lat ?? latLng._lat ?? latLng.latValue);
  const lng =
    typeof latLng.lng === 'function'
      ? latLng.lng()
      : (latLng.lng ?? latLng._lng ?? latLng.lngValue);
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
}

export function extractLatLngFromVectorEvent(event: unknown): TmapLatLngLike | null {
  if (!event || typeof event !== 'object') return null;

  const eventObject = event as Record<string, unknown>;
  const candidates: unknown[] = [
    eventObject.lngLat,
    eventObject.latLng,
    eventObject._latLng,
    eventObject.fi,
    (eventObject.fi as Record<string, unknown> | undefined)?.lngLat,
    (eventObject.fi as Record<string, unknown> | undefined)?.latLng,
    (eventObject.fi as Record<string, unknown> | undefined)?._latLng,
    eventObject.Ai,
    (eventObject.Ai as Record<string, unknown> | undefined)?.lngLat,
    (eventObject.Ai as Record<string, unknown> | undefined)?.latLng,
    (eventObject.Ai as Record<string, unknown> | undefined)?._latLng,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const coordinate = toCoordinate(candidate as TmapLatLngLike);
    if (coordinate) return candidate as TmapLatLngLike;
  }

  return null;
}
