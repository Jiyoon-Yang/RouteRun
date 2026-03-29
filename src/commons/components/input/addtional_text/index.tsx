import styles from './styles.module.css';

export type InputAddtionalTextState = 'default' | 'success' | 'error' | 'disabled';

export interface InputAddtionalTextProps {
  message?: string;
  state?: InputAddtionalTextState;
  showIcon?: boolean;
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

function StatusIcon({ state }: { state: InputAddtionalTextState }) {
  if (state === 'disabled') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 6.3V10.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="10" cy="13.3" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (state === 'success') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M6.6 10.4L9 12.8L13.6 8.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 6.3V10.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="10" cy="13.3" r="1" fill="currentColor" />
    </svg>
  );
}

export default function InputAddtionalText({
  message,
  state = 'default',
  showIcon = true,
  className,
}: InputAddtionalTextProps) {
  if (!message || !message.trim()) {
    return null;
  }

  return (
    <p className={cn(styles.text, STATE_CLASS_MAP[state], className)}>
      {showIcon ? (
        <span className={styles.icon} aria-hidden="true">
          <StatusIcon state={state} />
        </span>
      ) : null}
      <span>{message}</span>
    </p>
  );
}
