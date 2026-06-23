/**
 * 홈 지도 최상위 줌(zoom ≤ 7)에서 코스/트랙을 권역(시/도) 단위로 묶어
 * 배지 마커("경기 24")로 표시하는 훅.
 */

import { useCallback } from 'react';

import type { Route, Track } from '@/commons/types/routerun';
import {
  REGION_BUCKET_LABEL,
  resolveRegionBucket,
  type RegionBucket,
} from '@/commons/utils/region/region-bucket';
import { bindTmapMarkerListener } from '@/commons/utils/tmap/events';
import type { TmapMap, TmapMarker, TmapV3API } from '@/commons/utils/tmap/types';

import { buildRegionClusterIconDataUrl } from '../utils/region-cluster-icon';

import type { MutableRefObject } from 'react';

const REGION_CLUSTER_FALLBACK_ZOOM = 9;

type RegionClusterPoint = { lat: number; lng: number };

type RegionClusterGroup = {
  count: number;
  sumLat: number;
  sumLng: number;
  points: RegionClusterPoint[];
};

type UseRegionClusterMarkersParams = {
  mapRef: MutableRefObject<TmapMap | null>;
  routesRef: MutableRefObject<Route[]>;
  tracksRef: MutableRefObject<Track[]>;
  regionClusterMarkersRef: MutableRefObject<Map<RegionBucket, TmapMarker>>;
  getTmapv3: () => TmapV3API | undefined;
};

function buildRegionGroups(routes: Route[], tracks: Track[]): Map<RegionBucket, RegionClusterGroup> {
  const groups = new Map<RegionBucket, RegionClusterGroup>();

  const addPoint = (region: string | null | undefined, lat: number, lng: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const bucket = resolveRegionBucket({ region, lat, lng });
    const existing = groups.get(bucket);
    if (existing) {
      existing.count += 1;
      existing.sumLat += lat;
      existing.sumLng += lng;
      existing.points.push({ lat, lng });
      return;
    }
    groups.set(bucket, { count: 1, sumLat: lat, sumLng: lng, points: [{ lat, lng }] });
  };

  routes.forEach((route) => addPoint(route.start_address_region, route.start_lat, route.start_lng));
  tracks.forEach((track) => addPoint(track.start_address_region, track.start_lat, track.start_lng));

  return groups;
}

export function useRegionClusterMarkers({
  mapRef,
  routesRef,
  tracksRef,
  regionClusterMarkersRef,
  getTmapv3,
}: UseRegionClusterMarkersParams) {
  const clearRegionClusters = useCallback(() => {
    regionClusterMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    regionClusterMarkersRef.current.clear();
  }, [regionClusterMarkersRef]);

  const focusRegionGroup = useCallback(
    (group: RegionClusterGroup) => {
      const map = mapRef.current;
      const Tmapv3 = getTmapv3();
      if (!map || !Tmapv3) return;

      if (group.points.length <= 1) {
        const point = group.points[0];
        if (!point) return;
        map.setCenter(new Tmapv3.LatLng(point.lat, point.lng));
        map.setZoom(REGION_CLUSTER_FALLBACK_ZOOM);
        return;
      }

      let minLat = group.points[0].lat;
      let maxLat = group.points[0].lat;
      let minLng = group.points[0].lng;
      let maxLng = group.points[0].lng;
      group.points.forEach((point) => {
        minLat = Math.min(minLat, point.lat);
        maxLat = Math.max(maxLat, point.lat);
        minLng = Math.min(minLng, point.lng);
        maxLng = Math.max(maxLng, point.lng);
      });

      if (maxLat - minLat === 0 && maxLng - minLng === 0) {
        map.setCenter(new Tmapv3.LatLng(minLat, minLng));
        map.setZoom(REGION_CLUSTER_FALLBACK_ZOOM);
        return;
      }

      if (typeof map.fitBounds !== 'function') return;
      const southWest = new Tmapv3.LatLng(minLat, minLng);
      const northEast = new Tmapv3.LatLng(maxLat, maxLng);
      const LatLngBounds = (
        Tmapv3 as unknown as { LatLngBounds?: new (sw: unknown, ne: unknown) => unknown }
      ).LatLngBounds;

      if (typeof LatLngBounds === 'function') {
        const bounds = new LatLngBounds(southWest, northEast);
        map.fitBounds(bounds, 0);
      } else {
        map.fitBounds(southWest, northEast);
      }
    },
    [getTmapv3, mapRef],
  );

  const syncRegionClusters = useCallback(
    (map: TmapMap) => {
      const Tmapv3 = getTmapv3();
      if (!Tmapv3) return;

      const groups = buildRegionGroups(routesRef.current, tracksRef.current);

      groups.forEach((group, bucket) => {
        const centroidLat = group.sumLat / group.count;
        const centroidLng = group.sumLng / group.count;
        const label = REGION_BUCKET_LABEL[bucket];
        const icon = buildRegionClusterIconDataUrl(label, group.count);

        const existingMarker = regionClusterMarkersRef.current.get(bucket);
        if (existingMarker) {
          existingMarker.setPosition(new Tmapv3.LatLng(centroidLat, centroidLng));
          existingMarker.setIcon?.(icon);
          return;
        }

        const marker = new Tmapv3.Marker({
          position: new Tmapv3.LatLng(centroidLat, centroidLng),
          icon,
          map,
        }) as TmapMarker;

        const handleClick = () => focusRegionGroup(group);
        bindTmapMarkerListener(marker, getTmapv3, 'click', handleClick);

        regionClusterMarkersRef.current.set(bucket, marker);
      });

      regionClusterMarkersRef.current.forEach((marker, bucket) => {
        if (groups.has(bucket)) return;
        marker.setMap(null);
        regionClusterMarkersRef.current.delete(bucket);
      });
    },
    [focusRegionGroup, getTmapv3, regionClusterMarkersRef, routesRef, tracksRef],
  );

  return { syncRegionClusters, clearRegionClusters };
}
