import type { ChangeEventHandler } from 'react';

import styles from './styles.module.css';

export { FieldLucideIcon, FIELD_LUCIDE_ICON_SIZE, FIELD_LUCIDE_STROKE_WIDTH } from '../../../icons';
export type { FieldLucideIconProps } from '../../../icons';

/** Figma PartTextPlaceholder — `focus_none`은 빈 값+포커스(placeholder 숨김, 캐럿만), `focus`는 포커스+placeholder 노출 시안 */
export type PlaceholderState =
  | 'default'
  | 'hover'
  | 'focus'
  | 'focus_none'
  | 'filled'
  | 'error'
  | 'success'
  | 'disabled';
export type PlaceholderVariant = 'primary' | 'secondary';

export interface PlaceholderProps {
  placeholder: string;
  value?: string;
  state: PlaceholderState;
  variant: PlaceholderVariant;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

const STATE_CLASS: Record<PlaceholderState, string | undefined> = {
  default: undefined,
  hover: styles.stateHover,
  focus: styles.stateFocus,
  focus_none: styles.stateFocusNone,
  filled: styles.stateFilled,
  error: styles.stateError,
  success: styles.stateSuccess,
  disabled: styles.stateDisabled,
};

export const Placeholder = ({
  placeholder,
  value = '',
  state,
  variant,
  showLeftIcon = true,
  showRightIcon = true,
  leftIcon,
  rightIcon,
  disabled,
  readOnly = false,
  onChange,
}: PlaceholderProps) => {
  const effectiveState: PlaceholderState = disabled ? 'disabled' : state;

  const filledValue = value !== '' ? value : placeholder;
  const hasContent = value !== '';

  const inputValue =
    effectiveState === 'filled' || effectiveState === 'success'
      ? filledValue
      : hasContent
        ? value
        : '';

  const hasVisibleInputValue = inputValue !== '';

  const filledFromDefaultInput = effectiveState === 'default' && hasContent;

  const stateClass = STATE_CLASS[effectiveState];
  const derivedFilledClass = filledFromDefaultInput ? styles.stateFilled : undefined;
  const rootClass = [styles.base, styles[variant], stateClass, derivedFilledClass]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootClass}
      data-variant={variant}
      data-state={effectiveState}
      data-readonly={readOnly ? 'true' : 'false'}
      data-has-input-value={hasVisibleInputValue ? 'true' : 'false'}
      aria-invalid={effectiveState === 'error'}
    >
      {showLeftIcon && leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}

      <input
        className={styles.input}
        placeholder={placeholder}
        value={inputValue}
        disabled={effectiveState === 'disabled'}
        readOnly={readOnly}
        onChange={onChange}
        aria-label={placeholder}
      />

      {showRightIcon && rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
    </div>
  );
};
