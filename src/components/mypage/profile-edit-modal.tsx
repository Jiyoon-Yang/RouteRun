'use client';

import { Modal } from '@/commons/components/modal';

import { useNicknameEdit } from './hooks/useNicknameEdit';

type ProfileEditModalProps = {
  initialNickname: string;
  onClose: () => void;
};

export function ProfileEditModal({ initialNickname, onClose }: ProfileEditModalProps) {
  const {
    value,
    isChecking,
    isAvailable,
    errorMessage,
    statusMessage,
    isPending,
    isSaveDisabled,
    onChange,
    onSubmit,
  } = useNicknameEdit({
    currentNickname: initialNickname,
    onSuccess: onClose,
  });

  const inputState = errorMessage
    ? 'error'
    : isChecking
      ? 'default'
      : isAvailable
        ? 'success'
        : 'default';
  const helperMessage = isChecking
    ? '중복 여부를 확인하고 있어요...'
    : (errorMessage ?? statusMessage ?? '');

  return (
    <Modal
      type="form"
      title="프로필 수정"
      inputLabel="닉네임"
      inputLabelType="required"
      inputRequired={true}
      inputValue={value}
      inputPlaceholder="2~10자 닉네임을 입력해 주세요"
      inputAdditionalText={helperMessage}
      inputAdditionalTextState={inputState}
      showInputAdditionalIcon={Boolean(errorMessage || isAvailable)}
      confirmText={isPending ? '저장 중...' : '저장'}
      confirmDisabled={isSaveDisabled}
      onInputChange={onChange}
      onConfirm={onSubmit}
      onCancel={onClose}
    />
  );
}
