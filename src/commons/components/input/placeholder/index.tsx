import type { LucideIcon } from 'lucide-react';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { FieldLucideIcon } from '@/commons/icons';

import styles from './styles.module.css';

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export interface PlaceholderProps extends NativeInputProps {
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  success?: boolean;
  /** 오류 스타일 — DOM에는 `aria-invalid`로 반영 */
  error?: boolean;
}

export const Placeholder = forwardRef<HTMLInputElement, PlaceholderProps>(function Placeholder(
  {
    className,
    showLeftIcon = true,
    showRightIcon = true,
    leftIcon,
    rightIcon,
    success = false,
    error = false,
    disabled,
    'aria-invalid': ariaInvalid,
    ...inputProps
  },
  ref,
) {
  const isInvalid = error || ariaInvalid === true || ariaInvalid === 'true';
  const ariaInvalidResolved = error ? true : ariaInvalid;
  const rootClassName = [styles.base, success ? styles.success : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootClassName}
      data-status={success ? 'success' : undefined}
      data-disabled={disabled ? 'true' : 'false'}
      data-invalid={isInvalid ? 'true' : 'false'}
    >
      <div className={styles.field}>
        {showLeftIcon && leftIcon ? (
          <span className={styles.iconSlot} aria-hidden>
            <FieldLucideIcon icon={leftIcon} />
          </span>
        ) : null}

        <input
          {...inputProps}
          ref={ref}
          className={styles.input}
          disabled={disabled}
          aria-invalid={ariaInvalidResolved}
        />

        {showRightIcon && rightIcon ? (
          <span className={styles.iconSlot} aria-hidden>
            <FieldLucideIcon icon={rightIcon} />
          </span>
        ) : null}
      </div>
    </div>
  );
});

export default Placeholder;
