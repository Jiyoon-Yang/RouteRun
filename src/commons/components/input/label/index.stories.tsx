import { Label } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

type LabelProps = React.ComponentProps<typeof Label>;

const meta = {
  title: 'Commons/Input/Label',
  component: Label,
  tags: ['autodocs'],
  args: {
    children: '라벨 텍스트',
    type: 'none',
    disabled: false,
  },
  argTypes: {
    children: { control: 'text' },
    type: {
      control: 'inline-radio',
      options: ['none', 'optional', 'required', 'info'],
    },
    htmlFor: { control: 'text' },
    className: { control: false },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '`type`에 따라 `(선택)`, `*`, 정보 아이콘이 표시됩니다. 비활성은 `disabled`로 제어합니다.',
      },
    },
  },
} satisfies Meta<LabelProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: '이메일',
  },
  render: (args) => <Label {...args} />,
};

export const None: Story = {
  args: {
    children: '이름',
    type: 'none',
  },
};

export const Optional: Story = {
  args: {
    children: '닉네임',
    type: 'optional',
  },
};

export const Required: Story = {
  args: {
    children: '이메일',
    type: 'required',
  },
};

export const Info: Story = {
  args: {
    children: '비밀번호',
    type: 'info',
  },
};

export const Disabled: Story = {
  args: {
    children: '휴대폰 번호',
    type: 'required',
    disabled: true,
  },
};

export const AllTypes: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Label type="none">기본 라벨</Label>
      <Label type="optional">선택 라벨</Label>
      <Label type="required">필수 라벨</Label>
      <Label type="info">정보 라벨</Label>
      <Label type="required" disabled>
        비활성 라벨
      </Label>
    </div>
  ),
};
