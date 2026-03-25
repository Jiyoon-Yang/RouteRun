import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import InputAddtionalText from './index';

const meta = {
  title: 'Commons/Input/AddtionalText',
  component: InputAddtionalText,
  tags: ['autodocs'],
  args: {
    message: '추가 안내 문구입니다.',
    state: 'default',
  },
  argTypes: {
    message: { control: 'text' },
    state: {
      control: 'inline-radio',
      options: ['default', 'success', 'error', 'disabled'],
    },
    className: { control: false },
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
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
    <div style={{ display: 'grid', gap: 12 }}>
      <InputAddtionalText {...args} message="기본 안내 문구입니다." state="default" />
      <InputAddtionalText {...args} message="정상적으로 입력되었습니다." state="success" />
      <InputAddtionalText {...args} message="입력 형식을 다시 확인해 주세요." state="error" />
      <InputAddtionalText {...args} message="현재 수정할 수 없는 항목입니다." state="disabled" />
    </div>
  ),
};

export const EmptyMessage: Story = {
  args: {
    message: '',
  },
  render: (args) => (
    <div>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-grey-600)' }}>
        message가 비어 있으면 컴포넌트는 아무것도 렌더하지 않습니다.
      </p>
      <InputAddtionalText {...args} />
    </div>
  ),
};
