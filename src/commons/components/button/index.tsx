import styles from './styles.module.css';

interface ButtonProps {
  children?: React.ReactNode;
  variant: 'fill' | 'outline';
  borderRadius: 'r12' | 'r16';
  size: 'small' | 'medium' | 'large' | 'Xlarge';
  color: 'blue' | 'red' | 'dark';
  iconOnly?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Button = ({
  children,
  variant,
  borderRadius,
  size,
  color,
  iconOnly,
  leftIcon,
  rightIcon,
  disabled,
  className,
  style,
  onClick,
}: ButtonProps) => {
  const iconSize = {
    small: styles.iconSmall,
    medium: styles.iconMedium,
    large: styles.iconLarge,
    Xlarge: styles.iconXLarge,
  } as const;

  const iconClass = `${styles.iconBase} ${iconSize[size]}`;

  const buttonClass = `
    ${styles.base}
    ${styles[variant]}
    ${styles[borderRadius]}
    ${styles[size]}
    ${styles[color]}
    ${iconOnly ? styles.iconOnly : ''}
    ${className ?? ''}
  `;

  return (
    <button
      type="button"
      className={buttonClass}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {leftIcon && <span className={iconClass}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={iconClass}>{rightIcon}</span>}
    </button>
  );
};
