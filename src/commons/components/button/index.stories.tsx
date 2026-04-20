import { Button } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonStoryArgs = ButtonProps & {
  showLeftIcon: boolean;
  showRightIcon: boolean;
};

const variantOptions: ButtonProps['variant'][] = ['fill', 'outline'];
const borderRadiusOptions: ButtonProps['borderRadius'][] = ['r12', 'r16'];
const sizeOptions: ButtonProps['size'][] = ['small', 'medium', 'large', 'Xlarge'];
const colorOptions: ButtonProps['color'][] = ['blue', 'red', 'dark'];

const sampleLeftIcon = <span aria-hidden>◀</span>;
const sampleRightIcon = <span aria-hidden>▶</span>;

const getSimulatedStateStyle = (
  variant: ButtonProps['variant'],
  color: ButtonProps['color'],
  state: 'hover' | 'active',
): React.CSSProperties => {
  const isActive = state === 'active';

  if (variant === 'fill') {
    const fillStateMap: Record<ButtonProps['color'], { hover: string; active: string }> = {
      blue: {
        hover: 'var(--color-blue-600)',
        active: 'var(--color-blue-700)',
      },
      red: {
        hover: 'var(--color-red-600)',
        active: 'var(--color-red-700)',
      },
      dark: {
        hover: 'var(--color-dark_grey-900)',
        active: 'var(--color-black-900)',
      },
    };

    return {
      background: isActive ? fillStateMap[color].active : fillStateMap[color].hover,
    };
  }

  const outlineStateMap: Record<
    ButtonProps['color'],
    {
      hover: { background: string; borderColor: string; color: string };
      active: { background: string; borderColor: string; color: string };
    }
  > = {
    blue: {
      hover: {
        background: 'var(--color-blue-50)',
        borderColor: 'var(--color-blue-300)',
        color: 'var(--color-blue-500)',
      },
      active: {
        background: 'var(--color-blue-100)',
        borderColor: 'var(--color-blue-600)',
        color: 'var(--color-blue-600)',
      },
    },
    red: {
      hover: {
        background: 'var(--color-red-50)',
        borderColor: 'var(--color-red-300)',
        color: 'var(--color-red-500)',
      },
      active: {
        background: 'var(--color-red-100)',
        borderColor: 'var(--color-red-600)',
        color: 'var(--color-red-600)',
      },
    },
    dark: {
      hover: {
        background: 'var(--color-dark_grey-50)',
        borderColor: 'var(--color-black-300)',
        color: 'var(--color-black-400)',
      },
      active: {
        background: 'var(--color-dark_grey-100)',
        borderColor: 'var(--color-black-500)',
        color: 'var(--color-black-900)',
      },
    },
  };

  const target = isActive ? outlineStateMap[color].active : outlineStateMap[color].hover;

  return {
    background: target.background,
    borderColor: target.borderColor,
    color: target.color,
  };
};

const withIconToggle = (args: ButtonStoryArgs) => {
  const { showLeftIcon, showRightIcon, ...buttonArgs } = args;
  return (
    <Button
      {...buttonArgs}
      leftIcon={showLeftIcon ? sampleLeftIcon : undefined}
      rightIcon={showRightIcon ? sampleRightIcon : undefined}
    />
  );
};

const meta = {
  title: 'Commons/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: '버튼',
    variant: 'fill',
    borderRadius: 'r12',
    size: 'medium',
    color: 'dark',
    disabled: false,
    showLeftIcon: false,
    showRightIcon: false,
    leftIcon: sampleLeftIcon,
    rightIcon: sampleRightIcon,
  },
  argTypes: {
    children: {
      control: 'text',
    },
    variant: {
      control: 'inline-radio',
      options: variantOptions,
    },
    borderRadius: {
      control: 'inline-radio',
      options: borderRadiusOptions,
    },
    size: {
      control: 'inline-radio',
      options: sizeOptions,
    },
    color: {
      control: 'inline-radio',
      options: colorOptions,
      description:
        '색상 의미 체계: primary = black(dark), secondary = blue, tertiary = red (variant가 아닌 color 기준)',
    },
    disabled: {
      control: 'boolean',
    },
    showLeftIcon: {
      control: 'boolean',
      description: '토글 ON 시 leftIcon 샘플 아이콘을 전달합니다.',
    },
    showRightIcon: {
      control: 'boolean',
      description: '토글 ON 시 rightIcon 샘플 아이콘을 전달합니다.',
    },
    leftIcon: {
      table: {
        disable: true,
      },
    },
    rightIcon: {
      table: {
        disable: true,
      },
    },
    onClick: {
      action: 'click',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Button 컬러 의미 체계: primary = black(dark), secondary = blue, tertiary = red. 이는 variant(fill/outline)가 아니라 color 의미 분류입니다.',
      },
    },
  },
  render: withIconToggle,
} satisfies Meta<ButtonStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FullWidth: Story = {
  args: {
    size: 'Xlarge',
    children: 'Full Width (Xlarge)',
  },
  render: (args) => {
    const { showLeftIcon, showRightIcon, ...buttonArgs } = args;
    return (
      <div style={{ width: 360 }}>
        <Button
          {...buttonArgs}
          leftIcon={showLeftIcon ? sampleLeftIcon : undefined}
          rightIcon={showRightIcon ? sampleRightIcon : undefined}
        />
      </div>
    );
  },
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {variantOptions.map((variant) => (
        <Button
          key={variant}
          {...args}
          variant={variant}
          leftIcon={args.showLeftIcon ? sampleLeftIcon : undefined}
          rightIcon={args.showRightIcon ? sampleRightIcon : undefined}
        >
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'color 비교: dark(primary), blue(secondary), red(tertiary). 의미 분류를 한 화면에서 확인합니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {colorOptions.map((color) => (
        <Button
          key={color}
          {...args}
          color={color}
          leftIcon={args.showLeftIcon ? sampleLeftIcon : undefined}
          rightIcon={args.showRightIcon ? sampleRightIcon : undefined}
        >
          {color === 'dark'
            ? 'primary (dark)'
            : color === 'blue'
              ? 'secondary (blue)'
              : 'tertiary (red)'}
        </Button>
      ))}
    </div>
  ),
};

export const States: Story = {
  args: {
    color: 'dark',
    variant: 'fill',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default / Hover(시뮬레이션) / Active(시뮬레이션) / Disabled 상태를 비교합니다. Hover/Active는 각 버튼에 마우스를 올리거나 클릭하여 즉시 검증할 수 있습니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          {...args}
          style={{ ...args.style, pointerEvents: 'none' }}
          leftIcon={args.showLeftIcon ? sampleLeftIcon : undefined}
          rightIcon={args.showRightIcon ? sampleRightIcon : undefined}
        >
          Default
        </Button>
        <Button
          {...args}
          style={{
            ...args.style,
            ...getSimulatedStateStyle(args.variant, args.color, 'hover'),
            pointerEvents: 'none',
          }}
          leftIcon={args.showLeftIcon ? sampleLeftIcon : undefined}
          rightIcon={args.showRightIcon ? sampleRightIcon : undefined}
        >
          Hover (시뮬레이션)
        </Button>
        <Button
          {...args}
          style={{
            ...args.style,
            ...getSimulatedStateStyle(args.variant, args.color, 'active'),
            pointerEvents: 'none',
          }}
          leftIcon={args.showLeftIcon ? sampleLeftIcon : undefined}
          rightIcon={args.showRightIcon ? sampleRightIcon : undefined}
        >
          Active (시뮬레이션)
        </Button>
        <Button
          {...args}
          disabled
          leftIcon={args.showLeftIcon ? sampleLeftIcon : undefined}
          rightIcon={args.showRightIcon ? sampleRightIcon : undefined}
        >
          Disabled
        </Button>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      {sizeOptions.map((size) => (
        <Button
          key={size}
          {...args}
          size={size}
          leftIcon={args.showLeftIcon ? sampleLeftIcon : undefined}
          rightIcon={args.showRightIcon ? sampleRightIcon : undefined}
        >
          {size}
        </Button>
      ))}
    </div>
  ),
};
