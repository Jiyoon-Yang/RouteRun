import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import { FieldLucideIcon } from '@/commons/icons';

import styles from './styles.module.css';

export type AddtionalTextState = 'default' | 'success' | 'error';

type NativeParagraphProps = HTMLAttributes<HTMLParagraphElement>;

export interface AddtionalTextProps extends NativeParagraphProps {
  message?: string;
  state?: AddtionalTextState;
  showIcon?: boolean;
}

const ICON_BY_STATE = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
} as const;

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

  const Icon = ICON_BY_STATE[state];
  const rootClassName = [styles.base, className ?? ''].filter(Boolean).join(' ');

  return (
    <p {...paragraphProps} className={rootClassName} data-state={state}>
      {showIcon ? (
        <span className={styles.icon} aria-hidden>
          <FieldLucideIcon icon={Icon} size={12} />
        </span>
      ) : null}
      <span className={styles.message}>{message}</span>
    </p>
  );
}

export default AddtionalText;
