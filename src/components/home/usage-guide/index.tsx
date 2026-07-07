'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/commons/components/icons';
import { EXTERNAL_LINKS } from '@/commons/constants/url';

import styles from './styles.module.css';

const COPY = {
  triggerAriaLabel: '사용 방법 안내 열기',
  title: '루트런 사용 가이드',
  description: '사용 방법을 확인해보세요!',
  openGuide: '가이드 열기',
} as const;

export function UsageGuide() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={COPY.triggerAriaLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name="circleHelp" size={22} />
      </button>
      {open ? (
        <div className={styles.tooltip} role="dialog" aria-label={COPY.title}>
          <div className={styles.tooltipHeader}>
            <Icon name="bookOpen" size={20} />
            <span className={styles.tooltipTitle}>{COPY.title}</span>
          </div>
          <p className={styles.tooltipDescription}>{COPY.description}</p>
          <a
            className={styles.openLink}
            href={EXTERNAL_LINKS.USAGE_GUIDE}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            {COPY.openGuide}
            <Icon name="externalLink" size={14} />
          </a>
        </div>
      ) : null}
    </div>
  );
}

export default UsageGuide;
