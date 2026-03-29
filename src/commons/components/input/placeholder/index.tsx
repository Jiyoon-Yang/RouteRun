import { InputHTMLAttributes } from 'react';

import styles from './styles.module.css';

export type InputPlaceholderState =
  | 'default'
  | 'hover'
  | 'filled'
  | 'active'
  | 'error'
  | 'disabled';

export interface InputPlaceholderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'disabled'
> {
  state?: InputPlaceholderState;
  disabled?: boolean;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
}

function FieldIcon() {
  return (
    <span className={styles.iconSlot} aria-hidden="true">
      <span className={styles.icon}>
        <svg viewBox="0 0 20 20" focusable="false">
          <path
            d="M8 4H4v4M12 4h4v4M8 16H4v-4M12 16h4v-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  );
}

const STATE_CLASS_MAP: Record<InputPlaceholderState, string> = {
  default: styles.stateDefault,
  hover: styles.stateHover,
  filled: styles.stateFilled,
  active: styles.stateActive,
  error: styles.stateError,
  disabled: styles.stateDisabled,
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export default function InputPlaceholder({
  state = 'default',
  disabled = false,
  showLeftIcon = true,
  showRightIcon = true,
  className,
  ...rest
}: InputPlaceholderProps) {
  const isDisabled = state === 'disabled' || disabled;

  return (
    <div className={cn(styles.field, STATE_CLASS_MAP[state], className)}>
      {showLeftIcon ? <FieldIcon /> : null}
      <input {...rest} disabled={isDisabled} aria-disabled={isDisabled} className={styles.input} />
      {showRightIcon ? <FieldIcon /> : null}
    </div>
  );
}
