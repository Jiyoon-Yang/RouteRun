'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { submitReportAction } from '@/actions/report.action';
import { useToast } from '@/commons/providers/toast/toast.provider';
import type { ReportType } from '@/commons/types/routerun';

export const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'bug', label: '버그 신고' },
  { value: 'inconvenience', label: '불편함' },
  { value: 'suggestion', label: '기능 건의' },
];

export const MAX_REPORT_CONTENT = 500;
export const MIN_REPORT_CONTENT = 10;

export function useReportForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectType = useCallback((value: ReportType) => {
    setSelectedType(value);
    setError(null);
  }, []);

  const changeContent = useCallback((value: string) => {
    setContent(value);
    setError((prev) => (prev ? null : prev));
  }, []);

  const isSubmitEnabled = Boolean(selectedType) && content.trim().length >= MIN_REPORT_CONTENT;

  const handleSubmit = useCallback(() => {
    if (!selectedType) {
      setError('제보 유형을 선택해주세요.');
      return;
    }
    if (content.trim().length < MIN_REPORT_CONTENT) {
      setError(`내용을 ${MIN_REPORT_CONTENT}자 이상 입력해주세요.`);
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await submitReportAction({ type: selectedType, content });
      if (!result.success) {
        setError(result.message);
        return;
      }
      showToast('제보가 접수됐습니다.', 'success');
      router.push('/');
    });
  }, [selectedType, content, router, showToast]);

  return {
    selectedType,
    content,
    error,
    isPending,
    isSubmitEnabled,
    selectType,
    changeContent,
    handleSubmit,
  };
}
