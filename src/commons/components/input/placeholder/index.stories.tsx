import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Placeholder } from './index';

type PlaceholderProps = React.ComponentProps<typeof Placeholder>;

/** Figma node 139-2603 — 좌·우 `icon_placeholder` 동일 에셋(imgVector1, 스캔/코너 프레임) */
const FIGMA_ICON_SCAN_SRC = '/storybook-assets/input-placeholder/figma-icon-left.svg';

function FigmaStoryIcon({ src }: { src: string }) {
  return (
    // 스토리북: Figma export SVG를 그대로 쓰기 위해 정적 <img> 사용
    // eslint-disable-next-line @next/next/no-img-element -- Storybook 전용 Figma 에셋
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      draggable={false}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}

const stateOptions: PlaceholderProps['state'][] = [
  'default',
  'hover',
  'focus',
  'filled',
  'error',
  'disabled',
];
const variantOptions: PlaceholderProps['variant'][] = ['primary', 'secondary'];

const withSampleIcons = (args: PlaceholderProps, overrides?: Partial<PlaceholderProps>) => {
  const merged = { ...args, ...overrides };
  const { showLeftIcon = true, showRightIcon = true, ...rest } = merged;
  return (
    <Placeholder
      {...rest}
      showLeftIcon={showLeftIcon}
      showRightIcon={showRightIcon}
      leftIcon={showLeftIcon ? <FigmaStoryIcon src={FIGMA_ICON_SCAN_SRC} /> : undefined}
      rightIcon={showRightIcon ? <FigmaStoryIcon src={FIGMA_ICON_SCAN_SRC} /> : undefined}
    />
  );
};

const meta = {
  title: 'Commons/Input/Placeholder',
  component: Placeholder,
  tags: ['autodocs'],
  args: {
    placeholder: '검색어를 입력하세요',
    value: '',
    state: 'default',
    variant: 'primary',
    disabled: false,
    showLeftIcon: true,
    showRightIcon: true,
  },
  argTypes: {
    placeholder: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
    state: {
      control: 'select',
      options: stateOptions,
    },
    variant: {
      control: 'inline-radio',
      options: variantOptions,
    },
    disabled: {
      control: 'boolean',
    },
    showLeftIcon: {
      control: 'boolean',
      description: 'ON이면 왼쪽에 Figma `icon_placeholder` SVG(스캔)를 전달합니다.',
    },
    showRightIcon: {
      control: 'boolean',
      description: 'ON이면 오른쪽에 동일 스캔 아이콘을 전달합니다(디자인과 동일).',
    },
    leftIcon: { table: { disable: true } },
    rightIcon: { table: { disable: true } },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '아이콘은 Figma(node 139-2603) `icon_placeholder`와 동일한 SVG를 사용합니다. 포커스 행 디자인에는 텍스트와 트레일 사이 **클리어(X) 버튼**이 추가로 있으나, 현재 Placeholder API는 좌·우 슬롯 2개만 제공합니다. CSS는 버튼과 같이 `:hover`·`:focus-within`으로 상호작용하고, 스토리북에서만 동일 스타일을 고정할 때 `.stateHover` 등 모듈 클래스를 씁니다.',
      },
    },
  },
  render: (args) => <div style={{ width: 360 }}>{withSampleIcons(args)}</div>,
} satisfies Meta<PlaceholderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FullWidth: Story = {
  parameters: {
    docs: {
      description: {
        story: '필드는 `width: 100%`이므로, 넓은 컨테이너에서 가로로 꽉 차는지 확인합니다.',
      },
    },
  },
  render: (args) => <div style={{ width: '100%', maxWidth: 560 }}>{withSampleIcons(args)}</div>,
};

export const Variants: Story = {
  args: {
    state: 'default',
    value: '',
  },
  parameters: {
    docs: {
      description: {
        story: '동일 `state`에서 `primary` / `secondary` 테두리·배경 차이를 비교합니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {variantOptions.map((variant) => (
        <div key={variant} style={{ width: 320 }}>
          {withSampleIcons(args, { variant })}
        </div>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '각 `state` 값에 맞는 모듈 클래스가 한 화면에서 비교됩니다. `filled` 행은 표시용으로 `value`를 넣습니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 12 }}>
      {stateOptions.map((state) => (
        <div
          key={state}
          style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <span style={{ width: 88, fontSize: 12, color: 'var(--color-grey-700, #7e7e7e)' }}>
            {state}
          </span>
          <div style={{ flex: '1 1 260px', maxWidth: 360 }}>
            {withSampleIcons(args, {
              state,
              variant: 'primary',
              value: state === 'filled' ? '입력된 값 예시' : args.value,
            })}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Filled: Story = {
  args: {
    state: 'filled',
    placeholder: '이메일 주소',
    value: 'user@example.com',
  },
  parameters: {
    docs: {
      description: {
        story: '`state === "filled"`일 때 input에 `value ?? placeholder`가 보이는지 확인합니다.',
      },
    },
  },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '왼쪽: `disabled` prop만 true. 오른쪽: `state="disabled"`만 지정. 둘 다 비활성 스타일이어야 합니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ width: 320 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-grey-700, #7e7e7e)' }}>
          disabled prop
        </p>
        {withSampleIcons(args, { state: 'default', disabled: true })}
      </div>
      <div style={{ width: 320 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-grey-700, #7e7e7e)' }}>
          state=&quot;disabled&quot;
        </p>
        {withSampleIcons(args, { state: 'disabled', disabled: false })}
      </div>
    </div>
  ),
};
