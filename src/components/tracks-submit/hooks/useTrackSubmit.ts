'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createTrackAction, updateTrackAction } from '@/actions/track.action';
import { useToast } from '@/commons/providers/toast/toast.provider';
import { uploadCourseImages } from '@/commons/utils/storage';
import type { SaveTrackPayload } from '@/components/tmap/tracks-submit/hooks/useTrackMap';
import { reverseGeocodeRegion } from '@/repositories/map.repository';
import type { TrackDetailPayload } from '@/services/track/trackDetailService';

import type { ChangeEvent } from 'react';

export const MAX_TRACK_SUBMIT_IMAGES = 5;

export type UseTrackSubmitParams = {
  mode: 'new' | 'edit';
  trackId?: string;
  initialData?: TrackDetailPayload;
};

export function useTrackSubmit({ mode, trackId, initialData }: UseTrackSubmitParams) {
  const router = useRouter();
  const { showToast } = useToast();
  const [trackName, setTrackName] = useState('');
  const [description, setDescription] = useState('');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [trackData, setTrackData] = useState<SaveTrackPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!initialData?.track) return;
    const { title, description: desc, image_urls } = initialData.track;
    setTrackName(title ?? '');
    setDescription(typeof desc === 'string' ? desc : '');
    setExistingImageUrls(Array.isArray(image_urls) ? [...image_urls] : []);
  }, [initialData]);

  useEffect(() => {
    const nextUrls = images.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(nextUrls);
    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleSaveTrack = useCallback((payload: SaveTrackPayload) => {
    setTrackData(payload);
  }, []);

  const handleImageInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const selectedFiles = Array.from(files);
      setImages((prevImages) => {
        const currentTotal = existingImageUrls.length + prevImages.length;
        const remaining = MAX_TRACK_SUBMIT_IMAGES - currentTotal;
        if (remaining <= 0) return prevImages;
        return [...prevImages, ...selectedFiles.slice(0, remaining)];
      });
      e.target.value = '';
    },
    [existingImageUrls],
  );

  const handleRemoveExistingImage = useCallback((index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeImageAt = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const isSubmitEnabled =
    mode === 'edit'
      ? trackName.trim().length > 0
      : trackName.trim().length > 0 && trackData !== null && trackData.distanceMeters > 0;

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    const title = trackName.trim();

    if (mode === 'edit') {
      if (!title || !trackId?.trim()) return;
      submittingRef.current = true;
      setIsSubmitting(true);
      try {
        const uploadedUrls = await uploadCourseImages(images);
        const image_urls = [...existingImageUrls, ...uploadedUrls];
        const result = await updateTrackAction({
          trackId: trackId.trim(),
          title,
          description: description.trim() || null,
          image_urls,
        });
        if (!result.success) {
          showToast(result.error ?? '트랙 수정에 실패했습니다.', 'failed');
          setIsSubmitting(false);
          submittingRef.current = false;
          return;
        }
        // 페이지 전환이 끝나기 전에 스피너가 풀리지 않도록, 성공 시에는 isSubmitting을 유지한다
        // (컴포넌트가 언마운트되며 자연히 정리됨).
        router.push(`/tracks/${trackId.trim()}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '트랙 수정 중 오류가 발생했습니다.';
        showToast(message, 'failed');
        setIsSubmitting(false);
        submittingRef.current = false;
      }
      return;
    }

    if (!title || !trackData || trackData.distanceMeters <= 0) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const [imageUrls, addressRegion] = await Promise.all([
        uploadCourseImages(images),
        reverseGeocodeRegion({ lat: trackData.trackPoint.lat, lng: trackData.trackPoint.lng }),
      ]);
      const result = await createTrackAction({
        title,
        description: description.trim() || null,
        trackPoint: trackData.trackPoint,
        distanceMeters: trackData.distanceMeters,
        imageUrls,
        addressRegion,
      });
      if (!result.success) {
        showToast(result.message ?? '트랙 등록에 실패했습니다.', 'failed');
        setIsSubmitting(false);
        submittingRef.current = false;
        return;
      }
      // 페이지 전환이 끝나기 전에 스피너가 풀리지 않도록, 성공 시에는 isSubmitting을 유지한다
      // (컴포넌트가 언마운트되며 자연히 정리됨).
      router.push(`/tracks/${result.trackId}?registered=true`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '트랙 등록 중 오류가 발생했습니다.';
      showToast(message, 'failed');
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [
    trackName,
    trackId,
    description,
    existingImageUrls,
    images,
    mode,
    trackData,
    router,
    showToast,
  ]);

  return {
    trackName,
    setTrackName,
    description,
    setDescription,
    existingImageUrls,
    images,
    imagePreviewUrls,
    trackData,
    handleSaveTrack,
    handleImageInputChange,
    handleRemoveExistingImage,
    removeImageAt,
    handleSubmit,
    isSubmitEnabled,
    isSubmitting,
  };
}
