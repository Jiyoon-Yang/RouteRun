/**
 * 복합 Input Storybook — `prompts/prompt.201.stories.txt` 준수
 * Compound: `Input.Root` + `Label` + `Field` + `AddtionalText`. 필드 시각 상태는 DOM·CSS(가상클래스) 기준.
 */
import { Scan } from 'lucide-react';
import { useArgs } from 'storybook/preview-api';

import { Input } from './index';

import type { AddtionalTextState } from './addtional_text';
import type { LabelType } from './label';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ComponentProps, ReactNode } from 'react';

const iconArgs = {
  leftIcon: Scan,
  rightIcon: Scan,
} as const;

type InputControlState = 'default' | 'success' | 'error' | 'disabled';

type InputStoryArgs = Omit<ComponentProps<typeof Input.Field>, 'children'> & {
  label: ReactNode;
  labelType?: LabelType;
  additionalText?: string;
  additionalTextState?: AddtionalTextState;
  showAdditionalIcon?: boolean;
  state: InputControlState;
};

const mapStateToFieldAttrs = (state: InputControlState) => ({
  disabled: state === 'disabled',
  'aria-invalid': (state === 'error' ? true : undefined) as true | undefined,
  ...(state === 'success' ? ({ 'data-status': 'success' as const } as const) : {}),
});

function renderComposedInput(args: InputStoryArgs) {
  const {
    state,
    label,
    labelType,
    additionalText,
    additionalTextState,
    showAdditionalIcon = true,
    required,
    ...fieldRest
  } = args;
  const mapped = mapStateToFieldAttrs(state);
  const resolvedLabelType: LabelType = labelType ?? (required ? 'required' : 'none');

  const addtionalProps =
    additionalTextState !== undefined ? { state: additionalTextState as AddtionalTextState } : {};

  return (
    <Input.Root>
      <Input.Label type={resolvedLabelType}>{label}</Input.Label>
      <Input.Field {...fieldRest} {...mapped} required={required} />
      <Input.AddtionalText
        message={additionalText ?? ''}
        showIcon={showAdditionalIcon}
        {...addtionalProps}
      />
    </Input.Root>
  );
}

const meta = {
  title: 'Commons/Input',
  component: Input.Root,
  tags: ['autodocs'],
  args: {
    label: 'Label',
    labelType: 'none',
    placeholder: 'Placeholder',
    additionalText: '보조 설명 문구입니다.',
    showAdditionalIcon: true,
    state: 'default',
    showLeftIcon: true,
    showRightIcon: true,
    required: false,
    ...iconArgs,
  } satisfies InputStoryArgs,
  argTypes: {
    label: { control: 'text' },
    labelType: {
      control: 'radio',
      options: ['none', 'optional', 'required', 'info'],
      description: '라벨 표시 타입. (`required=true`일 때만 `required`로 자동 표시)',
    },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    additionalText: { control: 'text' },
    additionalTextState: {
      table: { disable: true },
      control: false,
    },
    state: {
      control: 'radio',
      options: ['default', 'success', 'error', 'disabled'],
      description: '필드 DOM 상태: default / data-status=success / aria-invalid / disabled',
    },
    showAdditionalIcon: { control: 'boolean' },
    disabled: { table: { disable: true }, control: false },
    'aria-invalid': { table: { disable: true }, control: false },
    required: { table: { disable: true }, control: false },
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
          'Figma [139:2557](https://www.figma.com/design/ALdH93pdOV32rbpqzxnEu3/%EB%9F%AC%EB%8B%9D%EC%BD%94%EC%8A%A4?node-id=139-2557&m=dev) — **Compound** (`Root`·`Label`·`Field`·`AddtionalText`). 필드 **hover/focus/filled**는 CSS 가상클래스, 오류·성공·비활성은 **`aria-invalid`·`data-status`·`disabled`** 로 반영합니다.',
      },
    },
  },
  render: (args: InputStoryArgs) => (
    <div style={{ width: '22.5rem' }}>{renderComposedInput(args)}</div>
  ),
} satisfies Meta<InputStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    placeholder: '검색어를 입력하세요',
    value: '',
    additionalText: '한 줄 안내 문구입니다.',
  },
  render: function PlaygroundRender() {
    const [args, updateArgs] = useArgs<InputStoryArgs>();
    return (
      <div style={{ width: '22.5rem' }}>
        {renderComposedInput({
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
        Figma 139:2557 — 복합 Input 8 상태
      </p>
      {(
        [
          {
            label: '1 Default',
            node: renderComposedInput({
              ...iconArgs,
              label: '라벨',
              state: 'default',
              value: '',
              placeholder: 'Placeholder',
              additionalText: '보조 문구',
            }),
          },
          {
            label: '2 Hover',
            node: renderComposedInput({
              ...iconArgs,
              label: '라벨',
              state: 'default',
              value: '',
              placeholder: 'Placeholder',
              additionalText: '보조 문구',
            }),
            hint: '→ Hover 스토리 또는 Pseudo States (:hover)',
          },
          {
            label: '3 FocusEmpty',
            node: renderComposedInput({
              ...iconArgs,
              label: '라벨',
              state: 'default',
              value: '',
              placeholder: 'Placeholder',
              additionalText: '보조 문구',
            }),
            hint: '→ FocusEmpty 스토리 또는 Pseudo States (:focus)',
          },
          {
            label: '4 FocusFilled',
            node: renderComposedInput({
              ...iconArgs,
              label: '라벨',
              state: 'default',
              value: '입력값',
              placeholder: 'Placeholder',
              additionalText: '보조 문구',
            }),
            hint: '→ FocusFilled 스토리',
          },
          {
            label: '5 Filled',
            node: renderComposedInput({
              ...iconArgs,
              label: '라벨',
              state: 'default',
              value: 'user@example.com',
              placeholder: '이메일',
              additionalText: '보조 문구',
            }),
          },
          {
            label: '6 Error',
            node: renderComposedInput({
              ...iconArgs,
              label: '라벨',
              state: 'error',
              value: '잘못된 입력',
              placeholder: 'Placeholder',
              additionalText: '오류가 발생했습니다.',
            }),
          },
          {
            label: '7 Success',
            node: renderComposedInput({
              ...iconArgs,
              label: '라벨',
              state: 'success',
              value: '러닝 코스',
              placeholder: '검색어를 입력하세요',
              additionalText: '확인되었습니다.',
            }),
          },
          {
            label: '8 Disabled',
            node: renderComposedInput({
              ...iconArgs,
              label: '라벨',
              state: 'disabled',
              value: '',
              placeholder: 'Placeholder',
              additionalText: '비활성 상태입니다.',
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
    label: '라벨',
    value: '',
    placeholder: 'Placeholder',
    additionalText: '보조 문구입니다.',
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
    label: '라벨',
    value: '',
    placeholder: 'Placeholder',
    additionalText: '보조 문구',
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
    label: '라벨',
    value: '',
    placeholder: 'Placeholder',
    additionalText: '보조 문구',
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
    label: '라벨',
    value: '입력값',
    placeholder: 'Placeholder',
    additionalText: '보조 문구',
    ...iconArgs,
  },
};

export const Filled: Story = {
  args: {
    label: '라벨',
    value: 'user@example.com',
    placeholder: '이메일 주소',
    additionalText: '보조 문구',
    ...iconArgs,
  },
};

export const Error: Story = {
  args: {
    label: '라벨',
    state: 'error',
    value: '잘못된 입력',
    placeholder: 'Placeholder',
    additionalText: '형식을 확인해 주세요.',
    additionalTextState: 'error',
    ...iconArgs,
  },
};

export const Success: Story = {
  args: {
    label: '라벨',
    state: 'success',
    value: '러닝 코스',
    placeholder: '검색어를 입력하세요',
    additionalText: '사용 가능한 값입니다.',
    additionalTextState: 'success',
    ...iconArgs,
  },
};

export const Disabled: Story = {
  args: {
    label: '라벨',
    state: 'disabled',
    value: '',
    placeholder: 'Placeholder',
    additionalText: '비활성 필드입니다.',
    ...iconArgs,
  },
};

export const RequiredLabel: Story = {
  args: {
    label: '이메일',
    required: true,
    placeholder: 'email@example.com',
    additionalText: '필수 입력 항목입니다.',
    ...iconArgs,
  },
};

export const OptionalLabel: Story = {
  args: {
    label: '닉네임',
    labelType: 'optional',
    placeholder: '표시 이름',
    additionalText: '선택 사항입니다.',
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
    <div style={{ width: '100%', maxWidth: '35rem' }}>{renderComposedInput(args)}</div>
  ),
};
