'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/commons/components/button';
import { LogoIcon } from '@/commons/components/icons';
import { LOGO_SIZE_PRESETS } from '@/commons/constants/logo-presets';
import { ROUTES } from '@/commons/constants/url';
import { useModal } from '@/commons/providers/modal/modal.provider';
import { useLogout } from '@/components/mypage/hooks/useLogout';

import { useAgreeTerms } from './hooks/useAgreeTerms';
import styles from './styles.module.css';

const ITEMS = [
  { key: 'age', label: '만 14세 이상입니다' },
  { key: 'terms', label: '이용약관 동의', href: ROUTES.TERMS, viewLabel: '이용약관 보기' },
  {
    key: 'privacy',
    label: '개인정보처리방침 확인',
    href: ROUTES.PRIVACY,
    viewLabel: '개인정보처리방침 보기',
  },
] as const;

type ItemKey = (typeof ITEMS)[number]['key'];

const LOGO_SIZE = LOGO_SIZE_PRESETS.login;

export type TermsAgreeProps = {
  /** 동의 후 이동할 경로 */
  returnTo: string;
  /** 게스트면 거절 시 계정을 지우고, 회원이면 로그아웃한다 */
  isAnonymous: boolean;
};

export function TermsAgree({ returnTo, isAnonymous }: TermsAgreeProps) {
  const [checked, setChecked] = useState<Record<ItemKey, boolean>>({
    age: false,
    terms: false,
    privacy: false,
  });
  const { agree, isPending, error } = useAgreeTerms(returnTo);
  const { executeLogoutOrDelete, isPending: isLeaving } = useLogout();
  const { openModal } = useModal();

  // 기존 게스트도 이 화면을 보므로, 작성한 글까지 지워지는 삭제는 반드시 확인을 거친다
  const confirmLeave = () =>
    openModal({
      type: 'confirm',
      title: '동의하지 않고 나가기',
      content: isAnonymous
        ? '게스트 계정과 작성한 글이 삭제되며 되돌릴 수 없습니다.\n진행하시겠습니까?'
        : '동의하지 않으면 서비스를 이용할 수 없습니다.\n로그아웃하시겠습니까?',
      onConfirm: () => void executeLogoutOrDelete(isAnonymous),
    });

  const allChecked = ITEMS.every(({ key }) => checked[key]);
  const isBusy = isPending || isLeaving;

  const toggleAll = () =>
    setChecked({ age: !allChecked, terms: !allChecked, privacy: !allChecked });

  return (
    <section className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.logoSection}>
          <LogoIcon width={LOGO_SIZE.width} height={LOGO_SIZE.height} className={styles.logo} />
        </div>

        <h1 className={styles.title}>서비스 이용을 위해 동의해 주세요</h1>

        <div className={styles.box}>
          <label className={`${styles.row} ${styles.allRow}`}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={allChecked}
              onChange={toggleAll}
            />
            전체 동의
          </label>
          {ITEMS.map((item) => (
            <div key={item.key} className={styles.row}>
              <label className={styles.rowLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={checked[item.key]}
                  onChange={() => setChecked((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                />
                <span>
                  <span className={styles.required}>(필수)</span> {item.label}
                </span>
              </label>
              {'href' in item && (
                <Link href={item.href} className={styles.viewLink} aria-label={item.viewLabel}>
                  보기
                </Link>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <Button
            variant="fill"
            color="dark"
            size="medium"
            borderRadius="r12"
            className={styles.agreeButton}
            disabled={!allChecked || isBusy}
            onClick={agree}
          >
            동의하고 시작하기
          </Button>
          <button
            type="button"
            className={styles.leaveButton}
            disabled={isBusy}
            onClick={confirmLeave}
          >
            동의하지 않고 나가기
          </button>
        </div>
      </div>
    </section>
  );
}
