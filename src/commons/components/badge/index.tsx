import styles from './styles.module.css';

type BadgeProps = {
  kind: 'course' | 'track';
  size?: 's' | 'm';
  className?: string;
};

export function Badge({ kind, size = 's', className }: BadgeProps) {
  const cls = [
    styles.badge,
    styles[size],
    kind === 'course' ? styles.course : styles.track,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{kind === 'course' ? '코스' : '트랙'}</span>;
}
