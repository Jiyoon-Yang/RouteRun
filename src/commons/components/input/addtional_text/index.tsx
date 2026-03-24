import styles from './styles.module.css';

export type InputAddtionalTextState = 'default' | 'success' | 'error' | 'disabled';

export interface InputAddtionalTextProps {
  message?: string;
  state?: InputAddtionalTextState;
  className?: string;
}

const STATE_CLASS_MAP: Record<InputAddtionalTextState, string> = {
  default: styles.stateDefault,
  success: styles.stateSuccess,
  error: styles.stateError,
  disabled: styles.stateDisabled,
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export default function InputAddtionalText({
  message,
  state = 'default',
  className,
}: InputAddtionalTextProps) {
  if (!message) {
    return null;
  }

  return (
    <p className={cn(styles.text, STATE_CLASS_MAP[state], className)}>
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8 7v3M8 5.2v.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>{message}</span>
    </p>
  );
}
