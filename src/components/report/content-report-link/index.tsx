'use client';

import { useRouter } from 'next/navigation';

import { ROUTES } from '@/commons/constants/url';
import { useRequireAuthModal } from '@/commons/hooks/useRequireAuthModal';
import type { ReportTarget } from '@/commons/types/routerun';
import { formatReportTarget } from '@/commons/utils/report-target';

import styles from './styles.module.css';

export type ContentReportLinkProps = {
  target: ReportTarget;
};

/** 코스·트랙 상세 하단의 "게시물 신고" — 로그인(게스트 포함) 후 제보 화면을 게시물 신고로 연다 */
export function ContentReportLink({ target }: ContentReportLinkProps) {
  const router = useRouter();
  const { requireAuth } = useRequireAuthModal();
  const href = `${ROUTES.REPORT}?target=${encodeURIComponent(formatReportTarget(target))}`;

  return (
    <button
      type="button"
      className={styles.link}
      onClick={() => {
        if (requireAuth({ redirectTo: href })) router.push(href);
      }}
    >
      이 게시물 신고하기
    </button>
  );
}
