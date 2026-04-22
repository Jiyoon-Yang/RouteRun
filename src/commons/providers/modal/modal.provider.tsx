'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Modal, type ModalProps } from '@/commons/components/modal';

import styles from './modal.provider.module.css';

// ─── 타입 ──────────────────────────────────────────────────────────────────────

type ModalOptions = Omit<ModalProps, 'onConfirm' | 'onCancel'> & {
  onConfirm?: () => void;
  onCancel?: () => void;
};

interface ModalContextValue {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

interface ModalProviderProps {
  children: React.ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

  const closeModal = useCallback(() => {
    setModalOptions(null);
  }, []);

  const openModal = useCallback((options: ModalOptions) => {
    setModalOptions(options);
  }, []);

  const value = useMemo<ModalContextValue>(
    () => ({ openModal, closeModal }),
    [openModal, closeModal],
  );

  const handleConfirm = useCallback(() => {
    modalOptions?.onConfirm?.();
    closeModal();
  }, [modalOptions, closeModal]);

  const handleCancel = useCallback(() => {
    modalOptions?.onCancel?.();
    closeModal();
  }, [modalOptions, closeModal]);

  const resolvedModalProps: ModalProps | null = useMemo(() => {
    if (!modalOptions) return null;
    if (modalOptions.type === 'alert') {
      return { ...modalOptions, onConfirm: handleConfirm } as ModalProps;
    }
    return { ...modalOptions, onConfirm: handleConfirm, onCancel: handleCancel } as ModalProps;
  }, [modalOptions, handleConfirm, handleCancel]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {typeof window !== 'undefined' &&
        resolvedModalProps !== null &&
        createPortal(
          <div className={styles.backdrop} role="dialog" aria-modal="true">
            <Modal {...resolvedModalProps} />
          </div>,
          document.body,
        )}
    </ModalContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal은 ModalProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
