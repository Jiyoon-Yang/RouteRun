import { Scan } from 'lucide-react';
import { forwardRef, useId, type ReactNode } from 'react';

import { AddtionalText, type AddtionalTextState } from './addtional_text';
import { Label, type LabelType } from './label';
import { Placeholder, type PlaceholderProps } from './placeholder';
import styles from './styles.module.css';

export type InputProps = PlaceholderProps & {
  /** 라벨 텍스트(없으면 Label 미렌더) */
  label?: ReactNode;
  /** 미지정 시 `required`(HTML)가 true이면 `required` 라벨 타입 */
  labelType?: LabelType;
  /** 필드 하단 보조 문구 */
  additionalText?: string;
  additionalTextState?: AddtionalTextState;
  showAdditionalIcon?: boolean;
  /** 최상위 래퍼 클래스 */
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    labelType,
    additionalText,
    additionalTextState = 'default',
    showAdditionalIcon = true,
    disabled = false,
    wrapperClassName,
    className,
    id: idProp,
    showLeftIcon = true,
    showRightIcon = true,
    leftIcon = Scan,
    rightIcon = Scan,
    required,
    ...rest
  },
  ref,
) {
  const uid = useId().replace(/:/g, '');
  const id = idProp ?? `input-${uid}`;
  const resolvedLabelType: LabelType = labelType ?? (required ? 'required' : 'none');

  const showLabel = label != null && label !== '';

  const rootClassName = [styles.root, wrapperClassName].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      {showLabel ? (
        <Label htmlFor={id} type={resolvedLabelType} disabled={!!disabled}>
          {label}
        </Label>
      ) : null}

      <Placeholder
        ref={ref}
        id={id}
        className={className}
        disabled={disabled}
        showLeftIcon={showLeftIcon}
        showRightIcon={showRightIcon}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        required={required}
        {...rest}
      />

      <AddtionalText
        message={additionalText ?? ''}
        state={additionalTextState}
        showIcon={showAdditionalIcon}
      />
    </div>
  );
});

export default Input;

export type { AddtionalTextState } from './addtional_text';
export type { LabelType } from './label';
export type { PlaceholderProps } from './placeholder';
