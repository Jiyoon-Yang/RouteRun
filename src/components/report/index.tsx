'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/commons/components/button';
import { Spinner } from '@/commons/components/spinner';
import { Header } from '@/commons/layout/header';

import {
  MAX_REPORT_CONTENT,
  MIN_REPORT_CONTENT,
  REPORT_TYPE_OPTIONS,
  useReportForm,
} from './hooks/useReportForm';
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

export function ReportPage() {
  const router = useRouter();
  const {
    selectedType,
    content,
    error,
    isPending,
    isSubmitEnabled,
    selectType,
    changeContent,
    handleSubmit,
  } = useReportForm();

  return (
    <section className={styles.root}>
      <Header
        title="제보하기"
        showLogo={false}
        showRightIcon={false}
        onLeftIconClick={() => router.back()}
      />
      <div className={styles.body}>
        <div className={styles.formSection}>
          <p className={styles.fieldLabel}>제보 유형</p>
          <div className={styles.typeChips}>
            {REPORT_TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={[
                  styles.chip,
                  selectedType === value ? styles.chipSelected : styles.chipDefault,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => selectType(value)}
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
            placeholder={`구체적으로 알려주세요. (${MIN_REPORT_CONTENT}자 ~ ${MAX_REPORT_CONTENT}자)`}
            value={content}
            maxLength={MAX_REPORT_CONTENT}
            onChange={(e) => changeContent(e.target.value)}
          />
          <p className={styles.charCount}>
            {content.length} / {MAX_REPORT_CONTENT}
          </p>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.submitWrapper}>
          <Button
            variant="fill"
            color="dark"
            size="medium"
            borderRadius="r16"
            style={{ width: '100%' }}
            disabled={isPending || !isSubmitEnabled}
            onClick={handleSubmit}
          >
            제출하기
          </Button>
        </div>
      </div>
      {isPending && <Spinner overlay size="lg" />}
    </section>
  );
}
