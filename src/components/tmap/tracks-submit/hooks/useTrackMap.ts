'use client';

import { useCallback, useRef, useState } from 'react';

import { useModal } from '@/commons/providers/modal/modal.provider';
import type { TmapMapLike } from '@/commons/types/tmap';

import { useTrackMapInitialization } from './useTrackMapInitialization';

export type SaveTrackPayload = {
  trackPoint: { lat: number; lng: number };
  distanceMeters: number;
};

type UseTrackMapParams = {
  onSaveTrack?: (payload: SaveTrackPayload) => void;
};

export function useTrackMap({ onSaveTrack }: UseTrackMapParams = {}) {
  const [trackPoint, setTrackPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const { openModal } = useModal();

  const mapRef = useRef<TmapMapLike | null>(null);
  const markerRef = useRef<{ setMap: (map: unknown) => void } | null>(null);

  const setMapInstance = useCallback((map: TmapMapLike) => {
    mapRef.current = map;
  }, []);

  const { initializeMap } = useTrackMapInitialization({
    setMapInstance,
    setTrackPoint,
    markerRef,
  });

  const reset = useCallback(() => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    setTrackPoint(null);
  }, []);

  const runSaveTrack = useCallback(() => {
    if (!trackPoint) return;
    setIsSaving(true);
    try {
      onSaveTrack?.({ trackPoint, distanceMeters });
    } finally {
      setIsSaving(false);
    }
  }, [distanceMeters, onSaveTrack, trackPoint]);

  const saveTrack = useCallback(() => {
    openModal({
      type: 'confirm',
      title: '저장하시겠습니까?',
      confirmText: '저장',
      onConfirm: () => {
        runSaveTrack();
      },
    });
  }, [openModal, runSaveTrack]);

  const canSave = trackPoint !== null && distanceMeters > 0;

  return {
    trackPoint,
    distanceMeters,
    setDistanceMeters,
    isSaving,
    canSave,
    mapRef,
    initializeMap,
    reset,
    saveTrack,
  };
}
