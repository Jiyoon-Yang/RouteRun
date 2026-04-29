'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { checkNicknameAction, updateNicknameAction } from '@/actions/user.action';
import { validateNickname } from '@/services/user/userValidation';

type UseNicknameEditParams = {
  currentNickname: string;
  onSuccess: () => void;
};

type UseNicknameEditReturn = {
  value: string;
  isChecking: boolean;
  isAvailable: boolean | null;
  errorMessage: string | null;
  statusMessage: string | null;
  isPending: boolean;
  isSaveDisabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function useNicknameEdit({
  currentNickname,
  onSuccess,
}: UseNicknameEditParams): UseNicknameEditReturn {
  const [value, setValue] = useState(currentNickname);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    const normalizedValue = value.trim();
    const normalizedCurrent = currentNickname.trim();

    if (!normalizedValue) {
      setIsChecking(false);
      setIsAvailable(null);
      setErrorMessage('닉네임을 입력해 주세요.');
      setStatusMessage(null);
      return;
    }

    if (normalizedValue === normalizedCurrent) {
      setIsChecking(false);
      setIsAvailable(true);
      setErrorMessage(null);
      setStatusMessage('현재 사용 중인 닉네임입니다.');
      return;
    }

    const validation = validateNickname(normalizedValue);
    if (!validation.isValid) {
      setIsChecking(false);
      setIsAvailable(false);
      setErrorMessage(validation.message);
      setStatusMessage(null);
      return;
    }

    const currentRequest = requestSequenceRef.current + 1;
    requestSequenceRef.current = currentRequest;
    setIsChecking(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await checkNicknameAction(normalizedValue);
        if (requestSequenceRef.current !== currentRequest) {
          return;
        }

        setIsChecking(false);
        setIsAvailable(result.isAvailable);
        setErrorMessage(result.isAvailable ? null : result.message);
        setStatusMessage(result.isAvailable ? result.message : null);
      } catch {
        if (requestSequenceRef.current !== currentRequest) {
          return;
        }
        setIsChecking(false);
        setIsAvailable(false);
        setErrorMessage('중복 검사를 다시 시도해 주세요.');
        setStatusMessage(null);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
      setIsChecking(false);
    };
  }, [value, currentNickname]);

  const onChange = useCallback((nextValue: string) => {
    setValue(nextValue);
  }, []);

  const onSubmit = useCallback(() => {
    const normalizedValue = value.trim();

    if (!isAvailable || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await updateNicknameAction(normalizedValue);
      if (!result.success) {
        setErrorMessage(result.message);
        setStatusMessage(null);
        return;
      }
      onSuccess();
    });
  }, [value, isAvailable, isPending, onSuccess]);

  return {
    value,
    isChecking,
    isAvailable,
    errorMessage,
    statusMessage,
    isPending,
    isSaveDisabled: isPending || isChecking || !isAvailable,
    onChange,
    onSubmit,
  };
}
