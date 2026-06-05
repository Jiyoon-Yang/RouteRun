/**
 * 홈 상단 메뉴 — 햄버거(메뉴) 아이콘으로 열리는 우측 드로어
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Icon } from '@/commons/components/icons';
import { ROUTES } from '@/commons/constants/url';
import { useRequireAuthModal } from '@/commons/hooks/useRequireAuthModal';

import styles from './styles.module.css';

const COPY = {
  dialogLabel: '추가 메뉴',
  closeMenu: '메뉴 닫기',
  closePanel: '닫기',
  notices: '공지사항',
  report: '제보하기',
} as const;

export type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const { requireAuth } = useRequireAuthModal();

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const rootClass = [styles.root, open ? styles.rootOpen : ''].filter(Boolean).join(' ').trim();

  return (
    <div className={rootClass} aria-hidden={!open}>
      <button
        type="button"
        className={styles.dismissOutside}
        aria-label={COPY.closeMenu}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <div className={styles.column}>
        <button
          type="button"
          className={styles.backdrop}
          aria-label={COPY.closeMenu}
          tabIndex={open ? 0 : -1}
          onClick={onClose}
        />
        <aside
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label={COPY.dialogLabel}
          aria-hidden={!open}
        >
          <div className={styles.panelHeader}>
            <button
              type="button"
              className={styles.closeButton}
              aria-label={COPY.closePanel}
              tabIndex={open ? 0 : -1}
              onClick={onClose}
            >
              <Icon name="x" size={24} />
            </button>
          </div>
          <nav className={styles.nav} aria-label={COPY.dialogLabel}>
            <Link
              href={ROUTES.NOTICE}
              className={styles.navLink}
              tabIndex={open ? 0 : -1}
              aria-label={COPY.notices}
              onClick={onClose}
            >
              {COPY.notices}
            </Link>
            <button
              type="button"
              className={styles.navLink}
              tabIndex={open ? 0 : -1}
              onClick={() => {
                onClose();
                const canNavigate = requireAuth({ redirectTo: ROUTES.REPORT });
                if (canNavigate) router.push(ROUTES.REPORT);
              }}
            >
              {COPY.report}
            </button>
          </nav>
        </aside>
      </div>
    </div>
  );
}
