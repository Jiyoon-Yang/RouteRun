import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import InputAddtionalText from './index';

const meta = {
  title: 'Commons/Input/AddtionalText',
  component: InputAddtionalText,
  tags: ['autodocs'],
  args: {
    message: '안내 문구를 입력해주세요.',
    state: 'default',
    showIcon: true,
  },
  argTypes: {
    message: { control: 'text' },
    state: {
      control: 'inline-radio',
      options: ['default', 'success', 'error'],
    },
    showIcon: { control: 'boolean' },
    className: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputAddtionalText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, width: 320 }}>
      <InputAddtionalText {...args} state="default" message="기본 안내 문구입니다." />
      <InputAddtionalText {...args} state="success" message="사용 가능한 값입니다." />
      <InputAddtionalText {...args} state="error" message="유효하지 않은 값입니다." />
    </div>
  ),
};

export const WithoutMessage: Story = {
  args: {
    message: '',
    state: 'default',
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <InputAddtionalText {...args} />
      <div style={{ fontSize: 12, color: 'var(--color-grey-700)', marginTop: 8 }}>
        message가 비어 있으면 AddtionalText는 렌더되지 않습니다.
      </div>
    </div>
  ),
};
