import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Label, { LabelCompound } from './index';

const meta = {
  title: 'Commons/Input/Label',
  component: Label,
  tags: ['autodocs'],
  args: {
    children: '이메일',
    htmlFor: 'email',
    type: 'none',
    tooltip: '입력 형식 안내 문구입니다.',
    tooltipTrigger: 'hover',
  },
  argTypes: {
    children: { control: 'text' },
    htmlFor: { control: 'text' },
    type: {
      control: 'inline-radio',
      options: ['none', 'optional', 'required', 'info'],
    },
    tooltip: { control: 'text' },
    tooltipTrigger: {
      control: 'inline-radio',
      options: ['hover', 'click', 'both'],
    },
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
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Types: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, width: 320 }}>
      <Label {...args} type="none">
        none 라벨
      </Label>
      <Label {...args} type="optional">
        optional 라벨
      </Label>
      <Label {...args} type="required">
        required 라벨
      </Label>
      <Label {...args} type="info">
        info 라벨
      </Label>
    </div>
  ),
};

export const InfoIcon: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, width: 320 }}>
      <Label {...args} type="none">
        none (아이콘 미노출)
      </Label>
      <Label {...args} type="info">
        info (아이콘 자동 노출)
      </Label>
    </div>
  ),
};

export const InfoTooltipHover: Story = {
  args: {
    type: 'info',
    tooltip: '닉네임은 2자 이상 12자 이하로 입력해주세요.',
    tooltipTrigger: 'hover',
  },
};

export const InfoTooltipClick: Story = {
  args: {
    type: 'info',
    tooltip: '영문/숫자 조합을 권장합니다.',
    tooltipTrigger: 'click',
  },
};

export const InfoTooltipBoth: Story = {
  args: {
    type: 'info',
    tooltip: 'hover 또는 click으로 툴팁을 열 수 있습니다.',
    tooltipTrigger: 'both',
  },
};

/** Compound: Root / Text / Info 를 조립하는 사용 예 (기본 Label 과 동일 UI) */
export const CompoundPattern: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, width: 320 }}>
      <LabelCompound.Root htmlFor="compound-none" type="none">
        <LabelCompound.Text>none (텍스트만)</LabelCompound.Text>
      </LabelCompound.Root>

      <LabelCompound.Root htmlFor="compound-opt" type="optional">
        <LabelCompound.Text>optional 라벨</LabelCompound.Text>
      </LabelCompound.Root>

      <LabelCompound.Root htmlFor="compound-req" type="required">
        <LabelCompound.Text>required 라벨</LabelCompound.Text>
      </LabelCompound.Root>

      <LabelCompound.Root htmlFor="compound-info" type="info">
        <LabelCompound.Text>info 라벨</LabelCompound.Text>
        <LabelCompound.Info
          tooltip="Compound 패턴에서는 Info 를 명시적으로 배치합니다."
          tooltipTrigger="hover"
        />
      </LabelCompound.Root>
    </div>
  ),
};
