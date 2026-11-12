import styles from './styles.module.css';

const BADGE_LABEL = { course: '코스', track: '트랙', hidden: '숨김' } as const;

type BadgeProps = {
  kind: keyof typeof BADGE_LABEL;
  size?: 's' | 'm';
  className?: string;
};

export function Badge({ kind, size = 's', className }: BadgeProps) {
  const cls = [styles.badge, styles[size], styles[kind], className].filter(Boolean).join(' ');
  return <span className={cls}>{BADGE_LABEL[kind]}</span>;
}
