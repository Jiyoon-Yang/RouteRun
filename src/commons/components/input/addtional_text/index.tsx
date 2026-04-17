import { Icon, type IconName } from '@/commons/components/icons';

import styles from './styles.module.css';

import type { HTMLAttributes } from 'react';

export type AddtionalTextState = 'default' | 'success' | 'error';

type NativeParagraphProps = HTMLAttributes<HTMLParagraphElement>;

export interface AddtionalTextProps extends NativeParagraphProps {
  message?: string;
  state?: AddtionalTextState;
  showIcon?: boolean;
}

const ICON_BY_STATE: Record<AddtionalTextState, IconName> = {
  default: 'info',
  success: 'check',
  error: 'circleAlert',
};

export function AddtionalText({
  message = '',
  state = 'default',
  showIcon = true,
  className,
  ...paragraphProps
}: AddtionalTextProps) {
  if (message.trim().length === 0) {
    return null;
  }

  const iconName = ICON_BY_STATE[state];
  const rootClassName = [styles.base, className ?? ''].filter(Boolean).join(' ');

  return (
    <p {...paragraphProps} className={rootClassName} data-state={state}>
      {showIcon ? (
        <span className={styles.icon} aria-hidden>
          <Icon name={iconName} size={12} />
        </span>
      ) : null}
      <span className={styles.message}>{message}</span>
    </p>
  );
}

export default AddtionalText;
