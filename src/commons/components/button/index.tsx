import { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './styles.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonType = 'fill' | 'outline';
type ButtonState = 'default' | 'hover' | 'active' | 'disabled';
type ButtonSize = 'small' | 'medium' | 'large' | 'x-large';
type NativeButtonType = 'button' | 'submit' | 'reset';

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'disabled'
> {
  children: ReactNode;
  variant?: ButtonVariant;
  type?: ButtonType;
  state?: ButtonState;
  size?: ButtonSize;
  fullWidth?: boolean;
  nativeType?: NativeButtonType;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
}

const VARIANT_CLASS_MAP: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  tertiary: styles.variantTertiary,
};

const TYPE_CLASS_MAP: Record<ButtonType, string> = {
  fill: styles.typeFill,
  outline: styles.typeOutline,
};

const STATE_CLASS_MAP: Record<ButtonState, string> = {
  default: styles.stateDefault,
  hover: styles.stateHover,
  active: styles.stateActive,
  disabled: styles.stateDisabled,
};

const SIZE_CLASS_MAP: Record<ButtonSize, string> = {
  small: styles.sizeSmall,
  medium: styles.sizeMedium,
  large: styles.sizeLarge,
  'x-large': styles.sizeXLarge,
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export default function Button({
  children,
  variant = 'primary',
  type = 'fill',
  state = 'default',
  size = 'medium',
  fullWidth = false,
  nativeType = 'button',
  disabled = false,
  leftIcon,
  rightIcon,
  showLeftIcon = false,
  showRightIcon = false,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = state === 'disabled' || disabled;

  return (
    <button
      {...rest}
      type={nativeType}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={cn(
        styles.button,
        VARIANT_CLASS_MAP[variant],
        TYPE_CLASS_MAP[type],
        STATE_CLASS_MAP[state],
        SIZE_CLASS_MAP[size],
        fullWidth && styles.fullWidth,
        className,
      )}
    >
      {showLeftIcon && leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
      <span className={styles.label}>{children}</span>
      {showRightIcon && rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
    </button>
  );
}
