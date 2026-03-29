import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import styles from './styles.module.css';
import type { LabelType } from './types';

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export interface LabelCompoundRootProps {
  children: ReactNode;
  htmlFor?: string;
  type?: LabelType;
  className?: string;
}

function LabelCompoundRoot({ children, htmlFor, type = 'none', className }: LabelCompoundRootProps) {
  return (
    <label htmlFor={htmlFor} className={cn(styles.label, className)} data-type={type}>
      {children}
    </label>
  );
}

export interface LabelCompoundTextProps {
  children: string;
}

function LabelCompoundText({ children }: LabelCompoundTextProps) {
  return <>{children}</>;
}

export interface LabelCompoundInfoProps {
  tooltip?: string;
  tooltipTrigger?: 'hover' | 'click' | 'both';
}

function LabelCompoundInfo({ tooltip, tooltipTrigger = 'hover' }: LabelCompoundInfoProps) {
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isClickOpen, setIsClickOpen] = useState(false);
  const hasTooltip = Boolean(tooltip?.trim());
  const supportsHover = tooltipTrigger === 'hover' || tooltipTrigger === 'both';
  const supportsClick = tooltipTrigger === 'click' || tooltipTrigger === 'both';
  const isTooltipOpen = hasTooltip && (isHoverOpen || isClickOpen);

  useEffect(() => {
    if (!supportsClick || !isClickOpen) {
      return undefined;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsClickOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isClickOpen, supportsClick]);

  const handleMouseEnter = () => {
    if (supportsHover) {
      setIsHoverOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (supportsHover) {
      setIsHoverOpen(false);
    }
  };

  const handleFocus = () => {
    if (supportsHover) {
      setIsHoverOpen(true);
    }
  };

  const handleBlur = () => {
    if (supportsHover) {
      setIsHoverOpen(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (supportsClick) {
      setIsClickOpen((prev) => !prev);
    }
  };

  return (
    <span
      ref={wrapperRef}
      className={styles.iconWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={styles.iconButton}
        aria-label="라벨 정보"
        aria-expanded={hasTooltip ? isTooltipOpen : undefined}
        aria-describedby={hasTooltip ? tooltipId : undefined}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M10 8.1V12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="10" cy="6.2" r="0.9" fill="currentColor" />
          </svg>
        </span>
      </button>
      {isTooltipOpen ? (
        <span id={tooltipId} role="tooltip" className={styles.tooltip}>
          {tooltip}
        </span>
      ) : null}
    </span>
  );
}

LabelCompoundRoot.displayName = 'LabelCompound.Root';
LabelCompoundText.displayName = 'LabelCompound.Text';
LabelCompoundInfo.displayName = 'LabelCompound.Info';

export type LabelCompoundType = typeof LabelCompoundRoot & {
  Root: typeof LabelCompoundRoot;
  Text: typeof LabelCompoundText;
  Info: typeof LabelCompoundInfo;
};

/** 루트는 `LabelCompound` 또는 동일 컴포넌트인 `LabelCompound.Root` 로 사용 */
export const LabelCompound: LabelCompoundType = Object.assign(LabelCompoundRoot, {
  Root: LabelCompoundRoot,
  Text: LabelCompoundText,
  Info: LabelCompoundInfo,
});
