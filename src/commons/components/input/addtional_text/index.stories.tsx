import { AddtionalText } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof AddtionalText> = {
  title: 'Commons/Input/AddtionalText',
  component: AddtionalText,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    message: '필수 입력 항목을 확인해 주세요.',
    state: 'default',
    showIcon: true,
  },
  argTypes: {
    message: {
      control: 'text',
    },
    state: {
      control: 'inline-radio',
      options: ['default', 'success', 'error'],
    },
    showIcon: {
      control: 'boolean',
    },
    className: {
      control: false,
    },
  },
};

export default meta;

type Story = StoryObj<typeof AddtionalText>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <AddtionalText {...args} state="default" message="안내 문구입니다." />
      <AddtionalText {...args} state="success" message="사용 가능한 값입니다." />
      <AddtionalText {...args} state="error" message="입력값을 다시 확인해 주세요." />
    </div>
  ),
  args: {
    showIcon: true,
  },
};

export const WithoutIcon: Story = {
  args: {
    state: 'default',
    message: '아이콘 없이 문구만 노출합니다.',
    showIcon: false,
  },
};

export const WithoutMessage: Story = {
  args: {
    message: '',
  },
};
