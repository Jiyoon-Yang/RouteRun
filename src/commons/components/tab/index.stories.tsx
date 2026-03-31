import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TabButton } from './index';

const variantOptions = ['green', 'blue', 'orange', 'red'] as const;

const meta = {
  title: 'Commons/Tab',
  component: TabButton,
  tags: ['autodocs'],
  args: {
    children: '러닝 코스',
    variant: 'green',
    isActive: false,
  },
  argTypes: {
    children: {
      control: 'text',
    },
    variant: {
      control: 'inline-radio',
      options: variantOptions,
    },
    isActive: {
      control: 'boolean',
    },
    onClick: {
      action: 'click',
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TabButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {variantOptions.map((variant) => (
        <TabButton key={variant} {...args} variant={variant}>
          {variant}
        </TabButton>
      ))}
    </div>
  ),
};

export const ActiveStates: Story = {
  parameters: {
    docs: {
      description: {
        story: '각 컬러의 비활성/활성 상태를 함께 비교해 .active 상태 클래스를 검증합니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      {variantOptions.map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <TabButton {...args} variant={variant} isActive={false}>
            {variant} inactive
          </TabButton>
          <TabButton {...args} variant={variant} isActive>
            {variant} active
          </TabButton>
        </div>
      ))}
    </div>
  ),
};
