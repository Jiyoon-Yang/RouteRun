import { forwardRef } from 'react';

import { FieldLucideIcon } from '@/commons/components/icons';

import styles from './styles.module.css';

import type { LucideIcon } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export interface PlaceholderProps extends NativeInputProps {
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export const Placeholder = forwardRef<HTMLInputElement, PlaceholderProps>(function Placeholder(
  {
    className,
    showLeftIcon = true,
    showRightIcon = true,
    leftIcon,
    rightIcon,
    disabled,
    'aria-invalid': ariaInvalid,
    ...inputProps
  },
  ref,
) {
  const rootClassName = [styles.base, className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
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
          aria-invalid={ariaInvalid}
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
