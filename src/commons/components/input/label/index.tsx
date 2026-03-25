import styles from './styles.module.css';

export type InputLabelState = 'default' | 'error' | 'disabled';

export interface InputLabelProps {
  htmlFor?: string;
  text: string;
  required?: boolean;
  state?: InputLabelState;
  className?: string;
}

const STATE_CLASS_MAP: Record<InputLabelState, string> = {
  default: styles.stateDefault,
  error: styles.stateError,
  disabled: styles.stateDisabled,
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export default function InputLabel({
  htmlFor,
  text,
  required = false,
  state = 'default',
  className,
}: InputLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(styles.label, STATE_CLASS_MAP[state], className)}
    >
      <span>{text}</span>
      {required && <span className={styles.requiredMark}>*</span>}
    </label>
  );
}
