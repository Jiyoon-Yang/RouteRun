/**
 * Placeholder Storybook — `prompts/prompt.201.stories.txt` 준수
 * 아이콘: Lucide `Scan` → `leftIcon` / `rightIcon` (FieldLucideIcon 기본 크기·선두께는 컴포넌트가 lucide_field_icon 상수 사용)
 */
import { Scan } from 'lucide-react';
import { useArgs } from 'storybook/preview-api';

import { Placeholder } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

type PlaceholderProps = React.ComponentProps<typeof Placeholder>;

const iconArgs = {
  leftIcon: Scan,
  rightIcon: Scan,
} as const;

const meta = {
  title: 'Commons/Input/Placeholder',
  component: Placeholder,
  tags: ['autodocs'],
  args: {
    placeholder: 'Placeholder',
    disabled: false,
    success: false,
    error: false,
    showLeftIcon: true,
    showRightIcon: true,
    ...iconArgs,
  },
  argTypes: {
    placeholder: { control: 'text' },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
    success: { control: 'boolean' },
    error: {
      control: 'boolean',
      description: '오류 보더 — DOM에는 `aria-invalid`로 반영',
    },
    'aria-invalid': {
      table: { disable: true },
      control: false,
    },
    showLeftIcon: { control: 'boolean' },
    showRightIcon: { control: 'boolean' },
    leftIcon: { table: { disable: true } },
    rightIcon: { table: { disable: true } },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Figma [139:2603](https://www.figma.com/design/ALdH93pdOV32rbpqzxnEu3/%EB%9F%AC%EB%8B%9D%EC%BD%94%EC%8A%A4?node-id=139-2603&m=dev) — **단일 primary 필드**, `state` prop 없음. 8가지 시각 상태는 **Default / Hover / FocusEmpty / FocusFilled / Filled / Error / Success / Disabled** 스토리와 **States**에서 비교합니다. `:hover`·포커스는 **Pseudo States** 애드온 또는 각 스토리의 `parameters.pseudo`로 확인합니다.',
      },
    },
  },
  render: (args) => (
    <div style={{ width: '22.5rem' }}>
      <Placeholder {...args} />
    </div>
  ),
} satisfies Meta<PlaceholderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 인터랙티브 — `value`는 `useArgs`로 동기화 */
export const Playground: Story = {
  args: {
    placeholder: '검색어를 입력하세요',
    value: '',
  },
  render: function PlaygroundRender() {
    const [args, updateArgs] = useArgs<PlaceholderProps>();
    return (
      <div style={{ width: '22.5rem' }}>
        <Placeholder
          {...args}
          value={args.value ?? ''}
          onChange={(e) => {
            updateArgs({ value: e.target.value });
          }}
        />
      </div>
    );
  },
};

/** variant 축 없음 — prompt.101 단일 스타일만 존재 */
export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '이 컴포넌트는 **primary 단일 시각**만 제공합니다 (`variant`·`size` prop 없음). 아래는 그 유일한 외형입니다.',
      },
    },
  },
  args: {
    value: '',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

/** 한 화면에서 8개 상태 라벨 + 개별 스토리로 점검 */
export const States: Story = {
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          '**Hover · FocusEmpty · FocusFilled** 는 한 캔버스에 동시에 pseudo를 줄 수 없어, 기본 외형만 보이고 상세는 해당 이름의 스토리 또는 상단 **Pseudo States**에서 확인하세요. 나머지는 props만으로 재현됩니다.',
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
        Figma 139:2603 — 8 상태 요약
      </p>
      {(
        [
          {
            label: '1 Default',
            node: <Placeholder {...iconArgs} value="" placeholder="Placeholder" />,
          },
          {
            label: '2 Hover',
            node: <Placeholder {...iconArgs} value="" placeholder="Placeholder" />,
            hint: '→ Hover 스토리 또는 Pseudo States (:hover)',
          },
          {
            label: '3 FocusEmpty',
            node: <Placeholder {...iconArgs} value="" placeholder="Placeholder" />,
            hint: '→ FocusEmpty 스토리 또는 Pseudo States (:focus)',
          },
          {
            label: '4 FocusFilled',
            node: <Placeholder {...iconArgs} value="Placeholder" placeholder="Placeholder" />,
            hint: '→ FocusFilled 스토리 또는 Pseudo States (:focus)',
          },
          {
            label: '5 Filled',
            node: <Placeholder {...iconArgs} value="user@example.com" placeholder="이메일 주소" />,
          },
          {
            label: '6 Error',
            node: <Placeholder {...iconArgs} error value="잘못된 입력" placeholder="Placeholder" />,
          },
          {
            label: '7 Success',
            node: (
              <Placeholder
                {...iconArgs}
                success
                value="러닝 코스"
                placeholder="검색어를 입력하세요"
              />
            ),
          },
          {
            label: '8 Disabled',
            node: <Placeholder {...iconArgs} disabled value="" placeholder="Placeholder" />,
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

export const FullWidth: Story = {
  parameters: {
    docs: {
      description: {
        story: '부모가 넓을 때 `width: 100%` 동작 확인.',
      },
    },
  },
  render: (args) => (
    <div style={{ width: '100%', maxWidth: '35rem' }}>
      <Placeholder {...args} />
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
        story: 'Figma: 보더만 진해짐. **Pseudo states → hover** 로도 확인 가능.',
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
        story: '빈 값 + 포커스 — **Pseudo states → focus**',
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
        story:
          '**Focus + 값 있음**: `:focus-within` — 진한 보더, 배경 순백, 커서/입력 중인 상태. **Filled**와 달리 포커스가 들어간 상태입니다.',
      },
    },
  },
  args: {
    value: 'Placeholder',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

export const Filled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '**값만 있고 포커스 없음** (`:not(:focus-within)`): 보더는 연한 회색(default와 동일), 배경 순백. **FocusFilled**는 같은 값이라도 포커스가 있어 진한 보더입니다.',
      },
    },
  },
  args: {
    value: 'user@example.com',
    placeholder: '이메일 주소',
    ...iconArgs,
  },
};

export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story: '`error` → `aria-invalid` + `data-invalid`',
      },
    },
  },
  args: {
    error: true,
    value: '잘못된 입력',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};

export const Success: Story = {
  args: {
    success: true,
    value: '러닝 코스',
    placeholder: '검색어를 입력하세요',
    ...iconArgs,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: '',
    placeholder: 'Placeholder',
    ...iconArgs,
  },
};
