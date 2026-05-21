import { Button } from '@/commons/components/button';
import { Input, type AddtionalTextState, type LabelType } from '@/commons/components/input';

import styles from './styles.module.css';

type ModalType = 'confirm' | 'form' | 'alert' | 'dual';

type ModalBaseProps = {
  className?: string;
  type: ModalType;
  title: string;
  /** 제목 아래 본문 (확인·알림 등) */
  content?: string;
  confirmText?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
};

type ConfirmModalProps = ModalBaseProps & {
  type: 'confirm';
  cancelText?: string;
  onCancel?: () => void;
  onClose?: () => void;
};

type FormModalProps = ModalBaseProps & {
  type: 'form';
  cancelText?: string;
  onCancel?: () => void;
  onClose?: () => void;
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

type AlertModalProps = ModalBaseProps & {
  type: 'alert';
};

type DualModalProps = ModalBaseProps & {
  type: 'dual';
  primaryText?: string;
  onPrimary?: () => void;
  secondaryText?: string;
  onSecondary?: () => void;
};

export type ModalProps = ConfirmModalProps | FormModalProps | AlertModalProps | DualModalProps;

export function Modal(props: ModalProps) {
  const {
    className,
    type,
    title,
    content,
    confirmText,
    onConfirm,
    confirmDisabled = false,
  } = props;
  const rootClass = [styles.root, className].filter(Boolean).join(' ');
  const resolvedConfirmText = confirmText ?? (type === 'form' ? '저장' : '확인');

  const cancelText =
    type === 'confirm' || type === 'form' ? (props.cancelText ?? '취소') : undefined;
  const onCancel =
    type === 'confirm' || type === 'form' ? (props.onCancel ?? props.onClose) : undefined;

  const primaryText = type === 'dual' ? (props.primaryText ?? '확인') : undefined;
  const secondaryText = type === 'dual' ? (props.secondaryText ?? '취소') : undefined;
  const onPrimary = type === 'dual' ? props.onPrimary : undefined;
  const onSecondary = type === 'dual' ? props.onSecondary : undefined;

  const stopEventPropagation = (
    event:
      | React.MouseEvent<HTMLElement>
      | React.TouchEvent<HTMLElement>
      | React.PointerEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
  };

  return (
    <section
      className={rootClass}
      aria-label={title}
      onPointerDown={stopEventPropagation}
      onTouchStart={stopEventPropagation}
      onClick={stopEventPropagation}
    >
      <h2 className={styles.title}>{title}</h2>

      {content ? <p className={styles.content}>{content}</p> : null}

      {type === 'form' ? (
        <div className={styles.inputWrap}>
          <Input.Root>
            <Input.Label type={props.inputLabelType ?? (props.inputRequired ? 'required' : 'none')}>
              {props.inputLabel}
            </Input.Label>
            <Input.Field
              className={styles.inputField}
              required={props.inputRequired}
              value={props.inputValue}
              onChange={(event) => props.onInputChange(event.target.value)}
              placeholder={props.inputPlaceholder}
              showLeftIcon={false}
              showRightIcon={false}
            />
            <Input.AddtionalText
              message={props.inputAdditionalText ?? ''}
              state={props.inputAdditionalTextState}
              showIcon={props.showInputAdditionalIcon}
            />
          </Input.Root>
        </div>
      ) : null}

      <div className={styles.actions}>
        {type === 'dual' ? (
          <>
            <Button
              variant="outline"
              borderRadius="r16"
              size="medium"
              color="dark"
              className={styles.actionButton}
              onClick={onSecondary}
            >
              {secondaryText}
            </Button>
            <Button
              variant="outline"
              borderRadius="r16"
              size="medium"
              color="dark"
              className={styles.actionButton}
              onClick={onPrimary}
            >
              {primaryText}
            </Button>
          </>
        ) : (
          <>
            {cancelText !== undefined && (
              <Button
                variant="outline"
                borderRadius="r16"
                size="medium"
                color="dark"
                className={styles.actionButton}
                onClick={() => onCancel?.()}
              >
                {cancelText}
              </Button>
            )}

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
          </>
        )}
      </div>
    </section>
  );
}

export default Modal;
