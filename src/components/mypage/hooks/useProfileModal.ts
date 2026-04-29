'use client';

import { createElement, useCallback } from 'react';

import { useModal } from '@/commons/providers/modal/modal.provider';

import { ProfileEditModal } from '../ProfileEditModal';

type ProfileModalOptions = {
  initialNickname: string;
};

export function useProfileModal({ initialNickname }: ProfileModalOptions) {
  const { openModal, closeModal } = useModal();

  const open = useCallback(() => {
    openModal({
      type: 'alert',
      title: '프로필 수정',
      renderContent: ({ closeModal: closeFromProvider }) =>
        createElement(ProfileEditModal, {
          initialNickname,
          onClose: closeFromProvider,
        }),
    });
  }, [openModal, initialNickname]);

  const close = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return {
    open,
    close,
  };
}
