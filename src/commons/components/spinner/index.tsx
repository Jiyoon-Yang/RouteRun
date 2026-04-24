import styles from './styles.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`} role="status" aria-label="로딩 중" />
    </div>
  );
}
