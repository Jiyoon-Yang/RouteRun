import { useCallback, useRef } from 'react';

import type { TmapMapLike, TmapV3 } from '@/commons/types/tmap';
import { bindMapEvents } from '@/commons/utils/tmap/events';
import { getTmapv3Runtime } from '@/commons/utils/tmap/runtime';
import {
  extractLatLngFromVectorEvent,
  toCoordinate,
} from '@/components/tmap/course-submit/hooks/courseMap.utils';

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

const TRACK_MARKER_ICON = '/assets/icons/courses-marker/marker_gray.png';

type UseTrackMapInitializationParams = {
  setMapInstance: (map: TmapMapLike) => void;
  setTrackPoint: Dispatch<SetStateAction<{ lat: number; lng: number } | null>>;
  markerRef: MutableRefObject<{ setMap: (map: unknown) => void } | null>;
};

export function useTrackMapInitialization({
  setMapInstance,
  setTrackPoint,
  markerRef,
}: UseTrackMapInitializationParams) {
  const isMapInitializedRef = useRef(false);
  const isClickListenerBoundRef = useRef(false);
  const lastClickSignatureRef = useRef<string | null>(null);
  const mapInstanceRef = useRef<TmapMapLike | null>(null);

  const initializeMap = useCallback(
    (mapElementId: string, center: { lat: number; lng: number }) => {
      if (isMapInitializedRef.current) return;
      const Tmapv3 = getTmapv3Runtime() as TmapV3 | undefined;
      const mapElement = document.getElementById(mapElementId);
      if (!Tmapv3 || !mapElement) return;

      const map = new Tmapv3.Map(mapElementId, {
        center: new Tmapv3.LatLng(center.lat, center.lng),
        width: '100%',
        height: '100%',
        zoom: 15,
        scrollwheel: true,
        zoomControl: false,
        minZoom: 8,
      });
      setMapInstance(map);
      mapInstanceRef.current = map;
      isMapInitializedRef.current = true;

      const clickListener = (event?: unknown) => {
        const rawLatLng = extractLatLngFromVectorEvent(event);
        const coord = rawLatLng ? toCoordinate(rawLatLng) : null;
        if (!coord) return;

        const sig = `${coord.lat.toFixed(7)}:${coord.lng.toFixed(7)}`;
        if (lastClickSignatureRef.current === sig) return;
        lastClickSignatureRef.current = sig;
        window.setTimeout(() => {
          if (lastClickSignatureRef.current === sig) {
            lastClickSignatureRef.current = null;
          }
        }, 0);

        // 기존 마커 제거 후 새 위치에 gray 마커 생성
        if (markerRef.current) {
          markerRef.current.setMap(null);
          markerRef.current = null;
        }

        const marker = new (
          Tmapv3 as unknown as {
            Marker: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void };
          }
        ).Marker({
          position: new Tmapv3.LatLng(coord.lat, coord.lng),
          icon: TRACK_MARKER_ICON,
          map,
        });
        markerRef.current = marker;
        setTrackPoint({ lat: coord.lat, lng: coord.lng });
      };

      const bindClickListener = () => {
        if (isClickListenerBoundRef.current) return;

        const mapLike = map as TmapMapLike & {
          on?: (eventName: string, callback: (event?: unknown) => void) => void;
          addListener?: (eventName: string, callback: (event?: unknown) => void) => void;
        };

        const tmapv3WithEvent = Tmapv3 as TmapV3 & {
          Event?: {
            addListener?: (
              target: object,
              eventName: string,
              callback: (event?: unknown) => void,
            ) => void;
          };
        };

        if (typeof mapLike.on === 'function' || typeof mapLike.addListener === 'function') {
          bindMapEvents(mapLike, ['click', 'Click'], clickListener as () => void);
          isClickListenerBoundRef.current = true;
          return;
        }

        if (tmapv3WithEvent.Event?.addListener) {
          tmapv3WithEvent.Event.addListener(map as object, 'click', clickListener);
          tmapv3WithEvent.Event.addListener(map as object, 'Click', clickListener);
          isClickListenerBoundRef.current = true;
        }
      };

      const mapLikeWithLoad = map as TmapMapLike & {
        on?: (eventName: string, callback: () => void) => void;
        addListener?: (eventName: string, callback: () => void) => void;
      };

      if (
        typeof mapLikeWithLoad.on === 'function' ||
        typeof mapLikeWithLoad.addListener === 'function'
      ) {
        bindMapEvents(mapLikeWithLoad, ['load'], bindClickListener);
      }

      bindClickListener();
    },
    [markerRef, setMapInstance, setTrackPoint],
  );

  return { initializeMap };
}
