import styles from './styles.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  overlay?: boolean;
}

export function Spinner({ size = 'md', className, overlay }: SpinnerProps) {
  if (overlay) {
    return (
      <div className={styles.overlay}>
        <div className={`${styles.spinner} ${styles[size]}`} role="status" aria-label="로딩 중" />
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`} role="status" aria-label="로딩 중" />
    </div>
  );
}
