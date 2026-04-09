import { Scan } from 'lucide-react';
import { forwardRef, useId, type ReactNode } from 'react';

import { AddtionalText, type AddtionalTextState } from './addtional_text';
import { Label, type LabelType } from './label';
import { Placeholder, type PlaceholderProps } from './placeholder';
import styles from './styles.module.css';

export type InputProps = PlaceholderProps & {
  /** 라벨 텍스트(항상 노출) */
  label: ReactNode;
  /** 라벨 표시 타입(`none`/`optional`/`required`/`info`). 미지정 시 `required` 값으로 자동 결정 */
  labelType?: LabelType;
  /** 필드 하단 보조 문구 */
  additionalText?: string;
  additionalTextState?: AddtionalTextState;
  showAdditionalIcon?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    labelType,
    additionalText,
    additionalTextState,
    showAdditionalIcon = true,
    disabled = false,
    success = false,
    error = false,
    'aria-invalid': ariaInvalid,
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
  const isInvalid = error || ariaInvalid === true || ariaInvalid === 'true';
  const resolvedAdditionalTextState: AddtionalTextState =
    additionalTextState ?? (isInvalid ? 'error' : success ? 'success' : 'default');

  return (
    <div className={styles.root}>
      <Label htmlFor={id} type={resolvedLabelType}>
        {label}
      </Label>

      <Placeholder
        ref={ref}
        id={id}
        className={className}
        disabled={disabled}
        showLeftIcon={showLeftIcon}
        showRightIcon={showRightIcon}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        success={success}
        error={error}
        aria-invalid={ariaInvalid}
        required={required}
        {...rest}
      />

      <AddtionalText
        message={additionalText ?? ''}
        state={resolvedAdditionalTextState}
        showIcon={showAdditionalIcon}
      />
    </div>
  );
});

export default Input;

export type { AddtionalTextState } from './addtional_text';
export type { LabelType } from './label';
export type { PlaceholderProps } from './placeholder';
