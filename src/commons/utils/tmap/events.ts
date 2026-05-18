import type { TmapMarker, TmapV3API } from '@/commons/utils/tmap/types';

type EventBindable = {
  on?: (eventName: string, callback: () => void) => void;
  addListener?: (eventName: string, callback: () => void) => void;
};

export function bindMapEvents(
  target: EventBindable,
  eventNames: string[],
  callback: () => void,
): boolean {
  let bound = false;
  eventNames.forEach((eventName) => {
    if (typeof target.on === 'function') {
      target.on(eventName, callback);
      bound = true;
      return;
    }
    if (typeof target.addListener === 'function') {
      target.addListener(eventName, callback);
      bound = true;
    }
  });
  return bound;
}

export function bindSingleEvent(
  target: EventBindable,
  eventName: string,
  callback: () => void,
): void {
  if (typeof target.on === 'function') {
    try {
      target.on(eventName, callback);
      return;
    } catch {
      /* noop */
    }
  }
  if (typeof target.addListener === 'function') {
    try {
      target.addListener(eventName, callback);
    } catch {
      /* noop */
    }
  }
}

/** Tmap v3 마커 — 인스턴스 API와 전역 event/Event.addListener 모두 시도 */
export function bindTmapMarkerListener(
  marker: TmapMarker,
  getTmapv3: () => TmapV3API | undefined,
  eventName: string,
  callback: () => void,
): void {
  bindSingleEvent(marker, eventName, callback);

  const bindWithGlobalApi = (name: string) => {
    const tmap = getTmapv3();
    const addListener = tmap?.event?.addListener ?? tmap?.Event?.addListener;
    if (typeof addListener !== 'function') return;
    try {
      addListener(marker, name, callback);
    } catch {
      /* noop */
    }
  };

  bindWithGlobalApi(eventName);
  if (eventName === 'click') {
    bindWithGlobalApi('Click');
  }
  if (eventName === 'mouseover') {
    bindWithGlobalApi('MouseOver');
  }
  if (eventName === 'mouseout') {
    bindWithGlobalApi('MouseOut');
  }
}
