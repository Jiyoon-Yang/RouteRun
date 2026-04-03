import styles from './styles.module.css';

export { FieldLucideIcon, FIELD_LUCIDE_ICON_SIZE, FIELD_LUCIDE_STROKE_WIDTH } from '../../../icons';
export type { FieldLucideIconProps } from '../../../icons';

export type PlaceholderState = 'default' | 'hover' | 'focus' | 'filled' | 'error' | 'disabled';
export type PlaceholderVariant = 'primary' | 'secondary';

export interface PlaceholderProps {
  // placeholder (`state === 'filled'`이면 value로 표시, placeholder 문구는 숨김)
  placeholder: string;
  // `state === 'filled'`일 때 input value (없으면 placeholder 문자열 사용)
  value?: string;
  state: PlaceholderState; // 시각 상태
  variant: PlaceholderVariant; // primary | secondary 스타일 축
  showLeftIcon?: boolean; // 좌측 아이콘 노출 (기본 true)
  showRightIcon?: boolean; // 우측 아이콘 노출 (기본 true)
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean; // true면 disabled 스타일·동작
}

const STATE_CLASS: Record<PlaceholderState, string | undefined> = {
  default: undefined,
  hover: styles.stateHover,
  focus: styles.stateFocus,
  filled: styles.stateFilled,
  error: styles.stateError,
  disabled: styles.stateDisabled,
};

export const Placeholder = ({
  placeholder,
  value,
  state,
  variant,
  showLeftIcon = true,
  showRightIcon = true,
  leftIcon,
  rightIcon,
  disabled,
}: PlaceholderProps) => {
  const effectiveState: PlaceholderState = disabled ? 'disabled' : state;

  const filledValue = value ?? placeholder;

  const inputValue = effectiveState === 'filled' ? filledValue : '';

  const stateClass = STATE_CLASS[effectiveState];
  const rootClass = [styles.base, styles[variant], stateClass].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-variant={variant}
      data-state={effectiveState}
      aria-invalid={effectiveState === 'error'}
    >
      {showLeftIcon && leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}

      <input
        className={styles.input}
        placeholder={placeholder}
        value={inputValue}
        disabled={effectiveState === 'disabled'}
        readOnly
        aria-label={placeholder}
      />

      {showRightIcon && rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
    </div>
  );
};
