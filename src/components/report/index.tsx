'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { submitReportAction } from '@/actions/report.action';
import { Button } from '@/commons/components/button';
import { Header } from '@/commons/layout/header';
import { useToast } from '@/commons/providers/toast/toast.provider';
import type { ReportType } from '@/commons/types/routerun';

import styles from './styles.module.css';

// ── StaticInfoPage — 공지 등 정적 문구 전용 레이아웃 ─────────────────────────────

export type StaticInfoPageProps = {
  title: string;
  description: string;
};

export function StaticInfoPage({ title, description }: StaticInfoPageProps) {
  const router = useRouter();

  return (
    <section className={styles.root}>
      <Header
        title={title}
        showLogo={false}
        showRightIcon={false}
        onLeftIconClick={() => router.back()}
      />
      <div className={styles.body}>
        <p className={styles.guide}>{description}</p>
      </div>
    </section>
  );
}

// ── ReportPage ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'bug', label: '버그 신고' },
  { value: 'inconvenience', label: '불편함' },
  { value: 'suggestion', label: '기능 건의' },
];

const MAX_CONTENT = 500;

export function ReportPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!selectedType) {
      setError('제보 유형을 선택해주세요.');
      return;
    }
    if (content.trim().length < 10) {
      setError('내용을 10자 이상 입력해주세요.');
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await submitReportAction({ type: selectedType, content });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSelectedType(null);
      setContent('');
      showToast('제보가 접수됐습니다.', 'success');
    });
  }

  return (
    <section className={styles.root}>
      <Header
        title="제보하기"
        showLogo={false}
        showRightIcon={false}
        onLeftIconClick={() => router.back()}
      />
      <div className={styles.body}>
        <p className={styles.guide}>서비스를 이용하면서 불편했던 점이나 개선 의견을 알려주세요.</p>
        <div className={styles.divider} />

        <div className={styles.formSection}>
          <p className={styles.fieldLabel}>제보 유형</p>
          <div className={styles.typeChips}>
            {TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={[
                  styles.chip,
                  selectedType === value ? styles.chipSelected : styles.chipDefault,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setSelectedType(value);
                  setError(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <p className={styles.fieldLabel}>내용</p>
          <textarea
            className={styles.textarea}
            placeholder="구체적으로 알려주세요. (10자 ~ 500자)"
            value={content}
            maxLength={MAX_CONTENT}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
          />
          <p className={styles.charCount}>
            {content.length} / {MAX_CONTENT}
          </p>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.submitWrapper}>
          <Button
            variant="fill"
            color="dark"
            size="Xlarge"
            borderRadius="r16"
            className={styles.submitButton}
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending ? '제출 중...' : '제출하기'}
          </Button>
        </div>
      </div>
    </section>
  );
}
