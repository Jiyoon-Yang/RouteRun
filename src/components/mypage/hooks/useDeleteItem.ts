'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useTransition } from 'react';

import { useModal } from '@/commons/providers/modal/modal.provider';

export type DeleteItemConfig = {
  confirmTitle: string;
  successTitle: string;
  errorMessage: string;
  deleteAction: (id: string) => Promise<{ success: boolean; error?: string }>;
};

export function useDeleteItem(config: DeleteItemConfig) {
  const { confirmTitle, successTitle, errorMessage } = config;
  const deleteActionRef = useRef(config.deleteAction);
  deleteActionRef.current = config.deleteAction;

  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { openModal, closeModal } = useModal();
  const isSubmittingRef = useRef(false);

  const deleteItem = useCallback(
    (id: string) => {
      openModal({
        type: 'confirm',
        title: confirmTitle,
        confirmText: '삭제',
        cancelText: '취소',
        closeOnConfirm: false,
        onConfirm: () => {
          if (isSubmittingRef.current) return;
          isSubmittingRef.current = true;

          startTransition(async () => {
            try {
              const result = await deleteActionRef.current(id);
              closeModal();

              if (result.success) {
                openModal({ type: 'alert', title: successTitle });
                router.refresh();
                return;
              }

              openModal({ type: 'alert', title: result.error ?? errorMessage });
            } finally {
              isSubmittingRef.current = false;
            }
          });
        },
      });
    },
    [closeModal, confirmTitle, errorMessage, openModal, router, successTitle],
  );

  return { isDeleting: isPending, deleteItem };
}
