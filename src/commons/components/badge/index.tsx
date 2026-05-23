import styles from './styles.module.css';

type BadgeProps = {
  kind: 'course' | 'track';
  className?: string;
};

export function Badge({ kind, className }: BadgeProps) {
  const cls = [styles.badge, kind === 'course' ? styles.course : styles.track, className]
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{kind === 'course' ? '코스' : '트랙'}</span>;
}
