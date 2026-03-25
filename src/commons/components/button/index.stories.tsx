import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Button from './index';

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.5V13.5M6.5 10H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const meta = {
  title: 'Commons/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: '버튼',
    variant: 'primary',
    type: 'fill',
    state: 'default',
    size: 'medium',
    fullWidth: false,
    nativeType: 'button',
    disabled: false,
    showLeftIcon: false,
    showRightIcon: false,
    leftIcon: <PlusIcon />,
    rightIcon: <PlusIcon />,
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary'],
    },
    type: {
      control: 'inline-radio',
      options: ['fill', 'outline'],
    },
    state: {
      control: 'inline-radio',
      options: ['default', 'hover', 'active', 'disabled'],
    },
    size: {
      control: 'inline-radio',
      options: ['small', 'medium', 'large', 'x-large'],
    },
    fullWidth: {
      control: 'boolean',
    },
    nativeType: {
      control: 'inline-radio',
      options: ['button', 'submit', 'reset'],
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
    leftIcon: {
      control: false,
    },
    rightIcon: {
      control: false,
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: '전체 너비 버튼',
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Button {...args} />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="tertiary">
        Tertiary
      </Button>
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} state="default">
        Default
      </Button>
      <Button {...args} state="hover">
        Hover
      </Button>
      <Button {...args} state="active">
        Active
      </Button>
      <Button {...args} state="disabled">
        Disabled
      </Button>
    </div>
  ),
};

export const Types: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} type="fill">
        Fill
      </Button>
      <Button {...args} type="outline">
        Outline
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} size="small">
        Small
      </Button>
      <Button {...args} size="medium">
        Medium
      </Button>
      <Button {...args} size="large">
        Large
      </Button>
      <Button {...args} size="x-large">
        X-Large
      </Button>
    </div>
  ),
};
