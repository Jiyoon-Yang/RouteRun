import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Input from './index';

const meta = {
  title: 'Commons/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    label: '이메일',
    required: false,
    state: 'default',
    placeholder: '이메일을 입력해 주세요',
    addtionalText: '필수 입력 항목입니다.',
    addtionalTextState: 'default',
    disabled: false,
    showLeftIcon: true,
    showRightIcon: true,
  },
  argTypes: {
    label: {
      control: 'text',
    },
    required: {
      control: 'boolean',
    },
    state: {
      control: 'inline-radio',
      options: ['default', 'hover', 'filled', 'active', 'error', 'disabled'],
    },
    placeholder: {
      control: 'text',
    },
    addtionalText: {
      control: 'text',
    },
    addtionalTextState: {
      control: 'inline-radio',
      options: ['default', 'success', 'error', 'disabled'],
    },
    disabled: {
      control: 'boolean',
    },
    showLeftIcon: {
      control: 'boolean',
    },
    showRightIcon: {
      control: 'boolean',
    },
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
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Input {...args} state="default" label="Default" addtionalText="기본 상태입니다." />
      <Input {...args} state="hover" label="Hover" addtionalText="호버 상태(시각용)입니다." />
      <Input
        {...args}
        state="filled"
        label="Filled"
        placeholder=""
        defaultValue="입력된 값이 있는 상태"
        addtionalText="값이 채워진 상태입니다."
      />
      <Input {...args} state="active" label="Active" addtionalText="포커스(활성) 상태입니다." />
      <Input {...args} state="error" label="Error" addtionalText="에러 상태입니다." />
      <Input {...args} state="disabled" label="Disabled" addtionalText="비활성화 상태입니다." />
    </div>
  ),
};

export const IconVisibility: Story = {
  name: 'Icon visibility (좌우 불린)',
  args: {
    state: 'default',
    placeholder: '아이콘 on/off 조합 확인',
    addtionalText: 'Controls에서 showLeftIcon / showRightIcon 을 바꿔 보세요.',
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Input {...args} label="양쪽 모두 (기본)" showLeftIcon showRightIcon />
      <Input {...args} label="왼쪽만" showLeftIcon showRightIcon={false} />
      <Input {...args} label="오른쪽만" showLeftIcon={false} showRightIcon />
      <Input {...args} label="둘 다 숨김" showLeftIcon={false} showRightIcon={false} />
    </div>
  ),
};

export const AdditionalTextStates: Story = {
  args: {
    state: 'default',
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Input
        {...args}
        label="Default additional text"
        addtionalText="기본 안내 문구입니다."
        addtionalTextState="default"
      />
      <Input
        {...args}
        label="Success additional text"
        addtionalText="정상적으로 입력되었습니다."
        addtionalTextState="success"
      />
      <Input
        {...args}
        label="Error additional text"
        addtionalText="입력 형식을 다시 확인해 주세요."
        addtionalTextState="error"
      />
      <Input
        {...args}
        label="Disabled additional text"
        addtionalText="현재 수정할 수 없는 항목입니다."
        addtionalTextState="disabled"
      />
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    placeholder: '라벨 없이 사용하는 입력창',
    addtionalText: '보조 문구만 노출됩니다.',
  },
};
