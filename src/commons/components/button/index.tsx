import styles from './styles.module.css';

interface ButtonProps {
  children: React.ReactNode;
  variant: 'fill' | 'outline';
  borderRadius: 'r12' | 'r16';
  size: 'small' | 'medium' | 'large' | 'Xlarge';
  color: 'blue' | 'red' | 'dark';
  leftIcon?: React.ReactNode; // 왼쪽 아이콘 (선택 사항)
  rightIcon?: React.ReactNode; // 오른쪽 아이콘 (선택 사항)
  disabled?: boolean;
  onClick?: () => void;
}

export const Button = ({
  children,
  variant,
  borderRadius,
  size,
  color,
  leftIcon,
  rightIcon,
  disabled,
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
    ${disabled ? styles.disabled : ''}
  `;

  return (
    <button type="button" className={buttonClass} onClick={onClick} disabled={disabled}>
      {leftIcon && <span className={iconClass}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={iconClass}>{rightIcon}</span>}
    </button>
  );
};
