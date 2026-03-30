import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import InputPlaceholder from './index';

const meta = {
  title: 'Commons/Input/Placeholder',
  component: InputPlaceholder,
  tags: ['autodocs'],
  args: {
    placeholder: 'Placeholder',
    state: 'default',
    disabled: false,
    showLeftIcon: true,
    showRightIcon: true,
  },
  argTypes: {
    placeholder: { control: 'text' },
    state: {
      control: 'inline-radio',
      options: ['default', 'hover', 'filled', 'active', 'error', 'disabled'],
    },
    disabled: { control: 'boolean' },
    showLeftIcon: { control: 'boolean' },
    showRightIcon: { control: 'boolean' },
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
} satisfies Meta<typeof InputPlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const IconVisibility: Story = {
  name: 'Icon visibility (좌우 불린)',
  args: {
    state: 'default',
    placeholder: 'Controls에서 좌우 아이콘 표시를 끄고 켤 수 있습니다.',
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <InputPlaceholder {...args} placeholder="양쪽 모두" showLeftIcon showRightIcon />
      <InputPlaceholder {...args} placeholder="왼쪽만" showLeftIcon showRightIcon={false} />
      <InputPlaceholder {...args} placeholder="오른쪽만" showLeftIcon={false} showRightIcon />
      <InputPlaceholder
        {...args}
        placeholder="둘 다 숨김"
        showLeftIcon={false}
        showRightIcon={false}
      />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <InputPlaceholder {...args} state="default" placeholder="Default" />
      <InputPlaceholder {...args} state="hover" placeholder="Hover" />
      <InputPlaceholder
        {...args}
        state="filled"
        placeholder=""
        defaultValue="Filled — 입력값 표시"
      />
      <InputPlaceholder {...args} state="active" placeholder="Active (focus 시각)" />
      <InputPlaceholder {...args} state="error" placeholder="Error" />
      <InputPlaceholder {...args} state="disabled" placeholder="Disabled" disabled />
    </div>
  ),
};
