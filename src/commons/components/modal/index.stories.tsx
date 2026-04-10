import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Modal } from './index';

type ModalProps = React.ComponentProps<typeof Modal>;
type FormModalProps = Extract<ModalProps, { type: 'form' }>;

const meta = {
  title: 'Commons/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "**폼 모달**(라벨 + 입력 필드)은 `type: 'form'`일 때만 보입니다. 캔버스에서 바로 보려면 **Form** 스토리를 선택하거나, Controls에서 `type`을 `form`으로 바꾸세요.",
      },
    },
  },
  args: {
    type: 'form',
    actions: 'dual',
    title: '프로필 수정',
    inputLabel: '닉네임',
    inputLabelType: 'required',
    inputValue: '러닝러버',
    inputPlaceholder: '닉네임을 입력해 주세요',
    inputRequired: true,
    cancelText: '취소',
    confirmText: '저장',
    confirmDisabled: false,
    onInputChange: () => {},
  } satisfies Partial<ModalProps>,
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['confirm', 'form'],
    },
    actions: {
      control: 'inline-radio',
      options: ['dual'],
    },
    onCancel: { action: 'cancel' },
    onConfirm: { action: 'confirm' },
    onInputChange: { action: 'input-change' },
    inputLabel: { control: 'text', if: { arg: 'type', eq: 'form' } },
    inputLabelType: {
      control: 'inline-radio',
      options: ['none', 'optional', 'required', 'info'],
      if: { arg: 'type', eq: 'form' },
    },
    inputValue: { control: 'text', if: { arg: 'type', eq: 'form' } },
    inputPlaceholder: { control: 'text', if: { arg: 'type', eq: 'form' } },
    inputRequired: { control: 'boolean', if: { arg: 'type', eq: 'form' } },
    inputAdditionalText: { control: 'text', if: { arg: 'type', eq: 'form' } },
    showInputAdditionalIcon: { control: 'boolean', if: { arg: 'type', eq: 'form' } },
  },
} satisfies Meta<ModalProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 피그마 148:3557 — 제목 + 라벨(필수) + 입력 필드 + 버튼 */
export const Form: Story = {
  args: {
    type: 'form',
    title: '프로필 수정',
    inputLabel: '닉네임',
    inputLabelType: 'required',
    inputValue: '러닝러버',
    inputPlaceholder: '닉네임을 입력해 주세요',
    inputRequired: true,
    cancelText: '취소',
    confirmText: '저장',
    onInputChange: () => {},
  } satisfies Partial<FormModalProps>,
};

export const Confirm: Story = {
  args: {
    type: 'confirm',
    title: '코스를 수정하시겠습니까?',
    cancelText: '취소',
    confirmText: '수정',
    confirmDisabled: false,
  },
};

export const ConfirmDisabled: Story = {
  args: {
    type: 'confirm',
    title: '코스를 수정하시겠습니까?',
    cancelText: '취소',
    confirmText: '수정',
    confirmDisabled: true,
  },
};
