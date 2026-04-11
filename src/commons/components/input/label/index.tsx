import { Info } from 'lucide-react';

import { FieldLucideIcon } from '@/commons/icons';

import styles from './styles.module.css';

import type { LabelHTMLAttributes, ReactNode } from 'react';

type NativeLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export type LabelType = 'none' | 'optional' | 'required' | 'info';

export interface LabelProps extends NativeLabelProps {
  type?: LabelType;
  disabled?: boolean;
  children: ReactNode;
}

export function Label({
  type = 'none',
  disabled = false,
  className,
  children,
  ...labelProps
}: LabelProps) {
  const rootClassName = [styles.base, className ?? ''].filter(Boolean).join(' ');

  return (
    <label {...labelProps} className={rootClassName} data-type={type} data-disabled={disabled}>
      <span className={styles.text}>{children}</span>
      <span className={styles.meta}>(선택)</span>
      <span className={styles.requiredMark} aria-hidden>
        *
      </span>
      <span className={styles.requiredSrOnly}>필수 입력</span>

      {type === 'info' ? (
        <span className={styles.infoIcon} aria-hidden>
          <FieldLucideIcon icon={Info} size={12} />
        </span>
      ) : null}
    </label>
  );
}

export default Label;
