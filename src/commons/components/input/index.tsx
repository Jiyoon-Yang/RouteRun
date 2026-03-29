import { InputHTMLAttributes, useId } from 'react';

import InputAddtionalText, { InputAddtionalTextState } from './addtional_text';
import InputLabel from './label';
import InputPlaceholder, { InputPlaceholderState } from './placeholder';
import styles from './styles.module.css';

export type InputState = InputPlaceholderState;

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'disabled'
> {
  label?: string;
  required?: boolean;
  state?: InputState;
  addtionalText?: string;
  addtionalTextState?: InputAddtionalTextState;
  disabled?: boolean;
  showLeftIcon?: boolean;
  showRightIcon?: boolean;
}

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function mapAddtionalTextState(
  state: InputState,
  explicitState?: InputAddtionalTextState,
): InputAddtionalTextState {
  if (explicitState) {
    return explicitState;
  }

  if (state === 'error') {
    return 'error';
  }

  if (state === 'disabled') {
    return 'disabled';
  }

  return 'default';
}

export default function Input({
  id,
  label,
  required = false,
  state = 'default',
  addtionalText,
  addtionalTextState,
  disabled = false,
  showLeftIcon = true,
  showRightIcon = true,
  className,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputState: InputState = disabled ? 'disabled' : state;

  return (
    <div className={cn(styles.container, className)}>
      {label && (
        <InputLabel htmlFor={inputId} type={required ? 'required' : 'none'}>
          {label}
        </InputLabel>
      )}

      <InputPlaceholder
        id={inputId}
        state={inputState}
        disabled={disabled}
        showLeftIcon={showLeftIcon}
        showRightIcon={showRightIcon}
        {...rest}
      />

      <InputAddtionalText
        message={addtionalText}
        state={mapAddtionalTextState(inputState, addtionalTextState)}
      />
    </div>
  );
}
