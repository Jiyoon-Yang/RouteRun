import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useArgs } from 'storybook/preview-api';

import { Modal } from './index';

type ModalProps = React.ComponentProps<typeof Modal>;
type FormModalProps = Extract<ModalProps, { type: 'form' }>;

const meta = {
  title: 'Commons/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
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
  },
} satisfies Meta<ModalProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirm: Story = {
  args: {
    type: 'confirm',
    actions: 'dual',
    title: '코스를 수정하시겠습니까?',
    cancelText: '취소',
    confirmText: '수정',
    confirmDisabled: false,
  },
};

export const Form: Story = {
  args: {
    type: 'form',
    actions: 'dual',
    title: '프로필 수정',
    inputLabel: 'Label',
    inputLabelType: 'required',
    inputValue: '러닝러버',
    inputPlaceholder: '닉네임을 입력해 주세요',
    inputRequired: true,
    cancelText: '취소',
    confirmText: '저장',
    confirmDisabled: false,
    onInputChange: () => {},
  },
  render: function FormRender(args) {
    const [{ inputValue }, updateArgs] = useArgs<{ inputValue?: string }>();
    return (
      <Modal
        {...(args as FormModalProps)}
        inputValue={inputValue ?? ''}
        onInputChange={(value) => {
          updateArgs({ inputValue: value });
          (args as FormModalProps).onInputChange(value);
        }}
      />
    );
  },
};

export const ConfirmDisabled: Story = {
  args: {
    type: 'confirm',
    actions: 'dual',
    title: '코스를 수정하시겠습니까?',
    cancelText: '취소',
    confirmText: '수정',
    confirmDisabled: true,
  },
};
