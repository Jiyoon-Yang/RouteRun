import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Fragment, useEffect, useState } from 'react';

import figmaIconLeftUrl from '@/assets/input-placeholder/figma-icon-left.svg';

import { Placeholder } from './index';

type PlaceholderProps = React.ComponentProps<typeof Placeholder>;

/** Figma node 139-2603 — 좌·우 `icon_placeholder` 동일 에셋 */
const FIGMA_ICON_SCAN_SRC = figmaIconLeftUrl;

function FigmaStoryIcon({ src }: { src: string }) {
  return (
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
  'focus_none',
  'filled',
  'error',
  'success',
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

/** Controls `value`와 캔버스 입력 동기화 — `state="default"`일 때 타이핑·filled 스타일 확인 */
function InteractivePlaceholderWithIcons(props: PlaceholderProps) {
  const { showLeftIcon = true, showRightIcon = true, value, ...rest } = props;
  const [inner, setInner] = useState(value ?? '');

  useEffect(() => {
    setInner(value ?? '');
  }, [value]);

  return (
    <Placeholder
      {...rest}
      showLeftIcon={showLeftIcon}
      showRightIcon={showRightIcon}
      leftIcon={showLeftIcon ? <FigmaStoryIcon src={FIGMA_ICON_SCAN_SRC} /> : undefined}
      rightIcon={showRightIcon ? <FigmaStoryIcon src={FIGMA_ICON_SCAN_SRC} /> : undefined}
      value={inner}
      readOnly={false}
      onChange={(e) => setInner(e.target.value)}
    />
  );
}

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
      description:
        '**Playground**에서는 보통 `state="default"`만 쓰고, 글자를 입력하면 **filled와 같은 스타일**이 `value` 기준으로 자동 반영됩니다. `hover`·`focus`·`filled` 등은 피그마 **시안 고정용** 모듈 클래스입니다. **focus**=placeholder 보임 + 다크 보더, **focus_none**=빈 값일 때 placeholder 숨김 시안, **success**=그린 보더.',
    },
    variant: {
      control: 'inline-radio',
      options: variantOptions,
    },
    disabled: {
      control: 'boolean',
    },
    readOnly: {
      control: false,
      table: { disable: true },
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
    onChange: { table: { disable: true } },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Figma [Placeholder 139:2603](https://www.figma.com/design/ALdH93pdOV32rbpqzxnEu3/%EB%9F%AC%EB%8B%9D%EC%BD%94%EC%8A%A4?node-id=139-2603&m=dev). **focus**는 다크 보더, **success**는 그린 보더(이전 primary-focus 스타일, secondary는 연한 배경+그린 보더). Primary 기본·filled·focus·error·success는 배경 없음, hover·disabled만 배경. Secondary는 기본·호버·filled·disabled는 테두리 없음·focus·error·success에서 테두리.',
      },
    },
  },
  render: (args) => <div style={{ width: 360 }}>{withSampleIcons(args, { readOnly: true })}</div>,
} satisfies Meta<PlaceholderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 360 }}>
      <InteractivePlaceholderWithIcons {...args} />
    </div>
  ),
};

export const FullWidth: Story = {
  parameters: {
    docs: {
      description: {
        story: '필드는 `width: 100%`이므로, 넓은 컨테이너에서 가로로 꽉 차는지 확인합니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <InteractivePlaceholderWithIcons {...args} />
    </div>
  ),
};

export const Variants: Story = {
  args: {
    state: 'default',
    value: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          '동일 `state`에서 `primary`(대부분 테두리만·hover·disabled만 배경) / `secondary`(테두리 없음·배경 위주) 차이를 비교합니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {variantOptions.map((variant) => (
        <div key={variant} style={{ width: 320 }}>
          {withSampleIcons(args, { variant, readOnly: true })}
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
          '**8행 × 2열**(`state` × `primary` | `secondary`). `filled` 행만 표시용 `value`를 넣습니다. **focus** 행에 마우스를 올려도 hover 배경이 겹치지 않습니다(`CSS`에서 `.stateFocus`는 `:hover` 시안과 분리). 인터랙션은 `Playground`에서 확인하세요.',
      },
    },
  },
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '100px minmax(0, 1fr) minmax(0, 1fr)',
        gap: '12px 16px',
        alignItems: 'center',
        maxWidth: 800,
      }}
    >
      <span />
      <span style={{ fontSize: 12, color: 'var(--color-grey-700, #7e7e7e)', fontWeight: 600 }}>
        primary
      </span>
      <span style={{ fontSize: 12, color: 'var(--color-grey-700, #7e7e7e)', fontWeight: 600 }}>
        secondary
      </span>
      {stateOptions.map((state) => (
        <Fragment key={state}>
          <span style={{ fontSize: 12, color: 'var(--color-grey-700, #7e7e7e)' }}>{state}</span>
          {variantOptions.map((variant) => (
            <div key={`${state}-${variant}`} style={{ minWidth: 0 }}>
              {withSampleIcons(args, {
                state,
                variant,
                value: state === 'filled' ? '입력된 값 예시' : args.value,
                readOnly: false,
                onChange: () => {},
              })}
            </div>
          ))}
        </Fragment>
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
        story:
          '**시안 전용** `state="filled"`일 때만, `value`가 비어 있으면 인풋에는 **빈 칸이 아니라 `placeholder` 문구가 채워진 것처럼** 보이게 됩니다(`filled`·`success` 분기). **Playground**에서는 `state="default"`로 두고 입력하는 것이 일반적이며, 이 경우 실제 **`value`**가 그대로 표시되고 filled 스타일은 입력 여부로만 결정됩니다.',
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
        {withSampleIcons(args, { state: 'default', disabled: true, readOnly: true })}
      </div>
      <div style={{ width: 320 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-grey-700, #7e7e7e)' }}>
          state=&quot;disabled&quot;
        </p>
        {withSampleIcons(args, { state: 'disabled', disabled: false, readOnly: true })}
      </div>
    </div>
  ),
};
