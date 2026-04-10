import { Toast } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

type ToastProps = React.ComponentProps<typeof Toast>;

const stateOptions: ToastProps['state'][] = ['success', 'failed'];

const meta = {
  title: 'Commons/Toast',
  component: Toast,
  tags: ['autodocs'],
  args: {
    state: 'success',
  },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: stateOptions,
      description: 'success: 코스 등록 성공 / failed: 코스 등록 실패',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toast 컴포넌트: state(success/failed)에 따라 아이콘과 텍스트, 색상이 변경됩니다.',
      },
    },
  },
} satisfies Meta<ToastProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllStates: Story = {
  parameters: {
    docs: {
      description: {
        story: 'success / failed 두 가지 상태를 한 화면에서 비교합니다.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {stateOptions.map((state) => (
        <Toast key={state} state={state} />
      ))}
    </div>
  ),
};
