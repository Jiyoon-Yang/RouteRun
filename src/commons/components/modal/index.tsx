import { Button } from '@/commons/components/button';
import { Input, type AddtionalTextState, type LabelType } from '@/commons/components/input';

import styles from './styles.module.css';

type ModalType = 'confirm' | 'form';
type ModalActions = 'dual';

type ModalBaseProps = {
  className?: string;
  type: ModalType;
  actions?: ModalActions;
  title: string;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
};

type ConfirmModalProps = ModalBaseProps & {
  type: 'confirm';
};

type FormModalProps = ModalBaseProps & {
  type: 'form';
  inputLabel: string;
  /** 미지정 시 `inputRequired`에 따라 `required` / `none`(피그마 148:3557 — 라벨 + 필드 동시 노출) */
  inputLabelType?: LabelType;
  inputValue: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  inputAdditionalText?: string;
  inputAdditionalTextState?: AddtionalTextState;
  showInputAdditionalIcon?: boolean;
  onInputChange: (value: string) => void;
};

export type ModalProps = ConfirmModalProps | FormModalProps;

export function Modal(props: ModalProps) {
  const {
    className,
    type,
    actions = 'dual',
    title,
    cancelText = '취소',
    confirmText,
    onCancel,
    onConfirm,
    confirmDisabled = false,
  } = props;
  const rootClass = [styles.root, className].filter(Boolean).join(' ');
  const resolvedConfirmText = confirmText ?? (type === 'form' ? '저장' : '수정');

  if (actions !== 'dual') {
    return null;
  }

  return (
    <section className={rootClass} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>

      {type === 'form' ? (
        <div className={styles.inputWrap}>
          <Input
            label={props.inputLabel}
            labelType={props.inputLabelType ?? (props.inputRequired ? 'required' : 'none')}
            required={props.inputRequired}
            value={props.inputValue}
            onChange={(event) => props.onInputChange(event.target.value)}
            placeholder={props.inputPlaceholder}
            additionalText={props.inputAdditionalText}
            additionalTextState={props.inputAdditionalTextState}
            showAdditionalIcon={props.showInputAdditionalIcon}
            className={styles.inputField}
            showLeftIcon={false}
            showRightIcon={false}
          />
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button
          variant="outline"
          borderRadius="r16"
          size="medium"
          color="dark"
          className={styles.actionButton}
          onClick={onCancel}
        >
          {cancelText}
        </Button>

        <Button
          variant="fill"
          borderRadius="r16"
          size="medium"
          color="dark"
          className={styles.actionButton}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {resolvedConfirmText}
        </Button>
      </div>
    </section>
  );
}

export default Modal;
