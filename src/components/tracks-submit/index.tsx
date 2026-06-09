'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import { Button } from '@/commons/components/button';
import { Icon } from '@/commons/components/icons';
import Input from '@/commons/components/input';
import { Label } from '@/commons/components/input/label';
import { Spinner } from '@/commons/components/spinner';
import Tooltip from '@/commons/components/tooltip';
import { Header } from '@/commons/layout/header';
import { useModal } from '@/commons/providers/modal/modal.provider';
import TmapTrackDetail from '@/components/tmap/track-detail';
import TmapTrackSubmit from '@/components/tmap/tracks-submit';
import type { TrackDetailPayload } from '@/services/track/trackDetailService';

import { MAX_TRACK_SUBMIT_IMAGES, useTrackSubmit } from './hooks/useTrackSubmit';
import styles from './styles.module.css';

const TEXTS = {
  TITLE_NEW: '트랙 등록',
  TITLE_EDIT: '트랙 수정',
  LABEL_TRACK_NAME: '트랙명',
  LABEL_DESCRIPTION: '설명',
  LABEL_IMAGE_UPLOAD: '이미지 업로드',
  TOOLTIP_DESCRIPTION: '트랙의 분위기, 특징 등을 자유롭게 작성해 주세요.',
  TOOLTIP_IMAGE_UPLOAD: '트랙 현장 이미지를 올려보세요.',
  PLACEHOLDER_TRACK_NAME: '트랙명을 입력하세요.',
  PLACEHOLDER_DESCRIPTION: '트랙에 대한 설명을 입력하세요',
  MAP_PREVIEW_LABEL: '등록된 트랙 위치',
  BUTTON_NEW: '등록하기',
  BUTTON_EDIT: '수정하기',
  CONFIRM_NEW_TITLE: '트랙을 등록하시겠습니까?',
  CONFIRM_NEW_CONTENT: '등록 후에는 위치와 거리를 수정할 수 없습니다.',
  CONFIRM_EDIT_TITLE: '트랙을 수정하시겠습니까?',
  CONFIRM_BUTTON: '확인',
} as const;

interface TrackSubmitProps {
  mode: 'new' | 'edit';
  trackId?: string;
  initialData?: TrackDetailPayload;
}

export default function TrackSubmit({ mode, trackId, initialData }: TrackSubmitProps) {
  const router = useRouter();
  const { openModal } = useModal();

  const {
    trackName,
    setTrackName,
    description,
    setDescription,
    existingImageUrls,
    images,
    imagePreviewUrls,
    handleSaveTrack,
    handleImageInputChange,
    handleRemoveExistingImage,
    removeImageAt,
    handleSubmit,
    isSubmitEnabled,
    isSubmitting,
  } = useTrackSubmit({ mode, trackId, initialData });

  const totalImageCount = existingImageUrls.length + images.length;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = mode === 'edit';
  const showReadOnlyMap = isEdit && initialData != null;
  const pageTitle = isEdit ? TEXTS.TITLE_EDIT : TEXTS.TITLE_NEW;
  const submitLabel = isEdit ? TEXTS.BUTTON_EDIT : TEXTS.BUTTON_NEW;

  const openSubmitConfirmModal = () => {
    openModal({
      type: 'confirm',
      title: isEdit ? TEXTS.CONFIRM_EDIT_TITLE : TEXTS.CONFIRM_NEW_TITLE,
      content: isEdit ? undefined : TEXTS.CONFIRM_NEW_CONTENT,
      confirmText: TEXTS.CONFIRM_BUTTON,
      onConfirm: () => {
        void handleSubmit();
      },
    });
  };

  return (
    <div className={styles.container}>
      <Header title={pageTitle} showRightIcon={false} onLeftIconClick={() => router.back()} />

      <div className={styles.mapArea} aria-label="지도 영역">
        <div className={styles.mapSlot}>
          {showReadOnlyMap ? (
            <TmapTrackDetail
              key={initialData.track.id}
              track={initialData.track}
              mapLabel={TEXTS.MAP_PREVIEW_LABEL}
            />
          ) : (
            <TmapTrackSubmit onSaveTrack={handleSaveTrack} />
          )}
        </div>
      </div>

      <div className={styles.formSection}>
        <Input.Root className={styles.fieldGroup}>
          <Input.Label type="required">{TEXTS.LABEL_TRACK_NAME}</Input.Label>
          <Input.Field
            placeholder={TEXTS.PLACEHOLDER_TRACK_NAME}
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
          />
        </Input.Root>

        <div className={styles.fieldGroup}>
          <div className={styles.infoLabelRow}>
            <Label type="optional">{TEXTS.LABEL_DESCRIPTION}</Label>
            <Tooltip content={TEXTS.TOOLTIP_DESCRIPTION}>
              <button type="button" className={styles.infoButton} aria-label="설명 도움말">
                <Icon name="info" size={14} color="var(--color-grey-600)" />
              </button>
            </Tooltip>
          </div>
          <textarea
            className={styles.textarea}
            placeholder={TEXTS.PLACEHOLDER_DESCRIPTION}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label={TEXTS.LABEL_DESCRIPTION}
          />
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupNoGap}`}>
          <div className={styles.infoLabelRow}>
            <Label type="optional">{TEXTS.LABEL_IMAGE_UPLOAD}</Label>
            <Tooltip content={TEXTS.TOOLTIP_IMAGE_UPLOAD}>
              <button type="button" className={styles.infoButton} aria-label="이미지 업로드 도움말">
                <Icon name="info" size={14} color="var(--color-grey-600)" />
              </button>
            </Tooltip>
          </div>
          <div className={styles.imageList}>
            <div className={styles.imageAddColumn}>
              <button
                type="button"
                className={styles.addImageButton}
                disabled={totalImageCount >= MAX_TRACK_SUBMIT_IMAGES}
                onClick={() => fileInputRef.current?.click()}
                aria-label="이미지 추가"
              >
                <span className={styles.addImageCircle}>
                  <Icon name="plus" size={12} color="var(--color-grey-300)" />
                </span>
                <span className={styles.addImageCount}>
                  {totalImageCount}/{MAX_TRACK_SUBMIT_IMAGES}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.fileInput}
                onChange={handleImageInputChange}
                aria-hidden="true"
              />
            </div>
            <div className={styles.imageListScroll}>
              {existingImageUrls.map((url, idx) => (
                <div key={`existing-${url}-${idx}`} className={styles.imageItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`등록된 이미지 ${idx + 1}`}
                    className={styles.imageThumb}
                    width={80}
                    height={80}
                  />
                  <button
                    type="button"
                    className={styles.deleteImageButton}
                    onClick={() => handleRemoveExistingImage(idx)}
                    aria-label={`등록된 이미지 ${idx + 1} 삭제`}
                  >
                    <Icon name="minus" size={12} color="var(--color-white-500)" />
                  </button>
                </div>
              ))}
              {imagePreviewUrls.map((src, idx) => (
                <div key={`${src}-${idx}`} className={styles.imageItem}>
                  <Image
                    src={src}
                    alt={`업로드 이미지 ${idx + 1}`}
                    className={styles.imageThumb}
                    width={80}
                    height={80}
                  />
                  <button
                    type="button"
                    className={styles.deleteImageButton}
                    onClick={() => removeImageAt(idx)}
                    aria-label={`이미지 ${idx + 1} 삭제`}
                  >
                    <Icon name="minus" size={12} color="var(--color-white-500)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.submitArea}>
          <Button
            variant="fill"
            borderRadius="r12"
            size="medium"
            color="dark"
            disabled={!isSubmitEnabled || isSubmitting}
            className={styles.submitButton}
            onClick={openSubmitConfirmModal}
          >
            {submitLabel}
          </Button>
        </div>
      </div>

      {isSubmitting && <Spinner overlay size="lg" />}
    </div>
  );
}
