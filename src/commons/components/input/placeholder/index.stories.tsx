/**
 * Placeholder 단일 필드 Storybook — `prompts/prompt.201.stories.txt` 준수
 * 시각 상태는 DOM·CSS(가상클래스) 기준. Hover/Focus는 Pseudo States 애드온.
 */
import { Scan } from 'lucide-react';
import { useArgs } from 'storybook/preview-api';

import { Placeholder } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ComponentProps } from 'react';

const iconArgs = {
  leftIcon: Scan,
  rightIcon: Scan,
} as const;

type PlaceholderControlState = 'default' | 'success' | 'error' | 'disabled';

type PlaceholderStoryArgs = ComponentProps<typeof Placeholder> & {
  state: PlaceholderControlState;
};

const mapStateToInputAttrs = (state: PlaceholderControlState) => ({
  disabled: state === 'disabled',
  'aria-invalid': (state === 'error' ? true : undefined) as true | undefined,
  ...(state === 'success' ? ({ 'data-status': 'success' as const } as const) : {}),
});

function renderPlaceholder(args: PlaceholderStoryArgs) {
  const { state, ...rest } = args;
  const mapped = mapStateToInputAttrs(state);
  return <Placeholder {...rest} {...mapped} />;
}

const meta = {
  title: 'Commons/Input/Placeholder',
  component: Placeholder,
  tags: ['autodocs'],
  args: {
    state: 'default',
    placeholder: 'Placeholder',
    value: '',
    showLeftIcon: true,
    showRightIcon: true,
    ...iconArgs,
  } satisfies PlaceholderStoryArgs,
  argTypes: {
    state: {
      control: 'radio',
      options: ['default', 'success', 'error', 'disabled'],
      description: '필드 DOM 상태: default / data-status=success / aria-invalid / disabled',
    },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    showLeftIcon: { control: 'boolean' },
    showRightIcon: { control: 'boolean' },
    disabled: { table: { disable: true }, control: false },
    'aria-invalid': { table: { disable: true }, control: false },
    leftIcon: { table: { disable: true } },
    rightIcon: { table: { disable: true } },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Figma [139:2603](https://www.figma.com/design/ALdH93pdOV32rbpqzxnEu3/%EB%9F%AC%EB%8B%9D%EC%BD%94%EC%8A%A4?node-id=139-2603&m=dev) — 단일 입력 필드. **icon_placeholder** → Lucide `Scan`. **hover / focus / filled** 는 CSS 가상클래스, **오류·성공·비활성** 은 **`aria-invalid`·`data-status`·`disabled`** 로 반영합니다. Docs/Canvas에서 **Pseudo states** 애드온으로 `:hover`, `:focus` 를 확인하세요.',
      },
    },
  },
  render: (args: PlaceholderStoryArgs) => (
    <div style={{ width: '22.5rem' }}>{renderPlaceholder(args)}</div>
  ),
} satisfies Meta<PlaceholderStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    placeholder: '검색어를 입력하세요',
    value: '',
    ...iconArgs,
  },
  render: function PlaygroundRender() {
    const [args, updateArgs] = useArgs<PlaceholderStoryArgs>();
    return (
      <div style={{ width: '22.5rem' }}>
        {renderPlaceholder({
          ...args,
          value: args.value ?? '',
          onChange: (e) => {
            updateArgs({ value: e.target.value });
          },
        })}
      </div>
    );
  },
};

export const States: Story = {
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          '필드 8상태 요약. **Hover · Focus** 는 Pseudo States 애드온 또는 개별 스토리에서 확인하세요.',
      },
    },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '40rem',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-grey-700)' }}>
        Figma 139:2603 — Placeholder 8 상태
      </p>
      {(
        [
          {
            label: '1 Default',
            node: renderPlaceholder({
              ...iconArgs,
              state: 'default',
              value: '',
              placeholder: 'Placeholder',
            }),
          },
          {
            label: '2 Hover',
            node: renderPlaceholder({
              ...iconArgs,
              state: 'default',
              value: '',
              placeholder: 'Placeholder',
            }),
            hint: '→ Hover 스토리 또는 Pseudo States (:hover)',
          },
          {
            label: '3 FocusEmpty',
            node: renderPlaceholder({
              ...iconArgs,
              state: 'default',
              value: '',
              placeholder: 'Placeholder',
            }),
            hint: '→ FocusEmpty 스토리 또는 Pseudo States (:focus)',
          },
          {
            label: '4 FocusFilled',
            node: renderPlaceholder({
              ...iconArgs,
              state: 'default',
              value: '입력값',
              placeholder: 'Placeholder',
            }),
            hint: '→ FocusFilled 스토리',
          },
          {
            label: '5 Filled',
            node: renderPlaceholder({
              ...iconArgs,
              state: 'default',
              value: 'user@example.com',
              placeholder: '이메일',
            }),
          },
          {
            label: '6 Error',
            node: renderPlaceholder({
              ...iconArgs,
              state: 'error',
              value: '잘못된 입력',
              placeholder: 'Placeholder',
            }),
          },
          {
            label: '7 Success',
            node: renderPlaceholder({
              ...iconArgs,
              state: 'success',
              value: '러닝 코스',
              placeholder: '검색어를 입력하세요',
            }),
          },
          {
            label: '8 Disabled',
            node: renderPlaceholder({
              ...iconArgs,
              state: 'disabled',
              value: '',
              placeholder: 'Placeholder',
            }),
          },
        ] as const
      ).map((row) => (
        <div
          key={row.label}
          style={{
            display: 'grid',
            gridTemplateColumns: '7.5rem minmax(0, 1fr)',
            gap: '0.75rem',
            alignItems: 'start',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-grey-800)',
              paddingTop: '0.75rem',
            }}
          >
            {row.label}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ width: '22.5rem', maxWidth: '100%' }}>{row.node}</div>
            {'hint' in row && row.hint ? (
              <p
                style={{
                  margin: '0.375rem 0 0',
                  fontSize: '0.6875rem',
                  color: 'var(--color-grey-600)',
                }}
              >
                {row.hint}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

export const Hover: Story = {
  parameters: {
    pseudo: { hover: true },
    docs: {
      description: {
        story: '필드 hover — **Pseudo states → hover**',
      },
    },
  },
  args: {
    value: '',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

export const FocusEmpty: Story = {
  parameters: {
    pseudo: { focus: true },
    docs: {
      description: {
        story: '빈 값 + 포커스',
      },
    },
  },
  args: {
    value: '',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

export const FocusFilled: Story = {
  parameters: {
    pseudo: { focus: true },
    docs: {
      description: {
        story: '값 있음 + 포커스',
      },
    },
  },
  args: {
    value: '입력값',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

export const Filled: Story = {
  args: {
    value: 'user@example.com',
    placeholder: '이메일 주소',
    ...iconArgs,
  },
};

export const Error: Story = {
  args: {
    state: 'error',
    value: '잘못된 입력',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

export const Success: Story = {
  args: {
    state: 'success',
    value: '러닝 코스',
    placeholder: '검색어를 입력하세요',
    ...iconArgs,
  },
};

export const Disabled: Story = {
  args: {
    state: 'disabled',
    value: '',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

export const FullWidth: Story = {
  parameters: {
    docs: {
      description: {
        story: '부모가 넓을 때 `width: 100%` 동작 확인.',
      },
    },
  },
  render: (args) => (
    <div style={{ width: '100%', maxWidth: '35rem' }}>{renderPlaceholder(args)}</div>
  ),
};
