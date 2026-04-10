import { Button } from '@/commons/components/button';
import { Input, type LabelType } from '@/commons/components/input';

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
  inputLabelType?: LabelType;
  inputValue: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
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
            labelType={props.inputLabelType}
            required={props.inputRequired}
            value={props.inputValue}
            onChange={(event) => props.onInputChange(event.target.value)}
            placeholder={props.inputPlaceholder}
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
