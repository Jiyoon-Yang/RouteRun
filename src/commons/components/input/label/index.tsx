import { useEffect, useId, useRef, useState } from 'react';
import styles from './styles.module.css';

export type LabelType = 'none' | 'optional' | 'required' | 'info';

export interface LabelProps {
  children: string;
  htmlFor?: string;
  type?: LabelType;
  icon?: boolean;
  tooltip?: string;
  tooltipTrigger?: 'hover' | 'click' | 'both';
  className?: string;
}

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export default function Label({
  children,
  htmlFor,
  type = 'none',
  icon = false,
  tooltip,
  tooltipTrigger = 'hover',
  className,
}: LabelProps) {
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isClickOpen, setIsClickOpen] = useState(false);
  const showInfoIcon = type === 'info' && icon;
  const hasTooltip = showInfoIcon && Boolean(tooltip?.trim());
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
    <label htmlFor={htmlFor} className={cn(styles.label, className)} data-type={type}>
      {children}
      {showInfoIcon ? (
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
      ) : null}
    </label>
  );
}
