import { Header, type HeaderProps } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
  title: 'Commons/Header',
  component: Header,
  tags: ['autodocs'],
  args: {
    title: '러닝 코스',
    showLeftIcon: false,
    showRightIcon: false,
  },
  argTypes: {
    title: {
      control: 'text',
      description: '헤더 상단 타이틀 텍스트',
    },
    showLeftIcon: {
      control: 'boolean',
      description: '좌측 아이콘 표시 여부',
    },
    showRightIcon: {
      control: 'boolean',
      description: '우측 아이콘 표시 여부',
    },
    className: {
      control: 'text',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '상단 타이틀을 표시하는 헤더 컴포넌트입니다. GNB(하단/메뉴) 요소는 포함하지 않습니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 375, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<HeaderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LongTitle: Story = {
  args: {
    title: '이번 주 추천 러닝 코스',
  },
  parameters: {
    docs: {
      description: {
        story: '긴 타이틀 문자열에서 헤더 텍스트 렌더링을 확인합니다.',
      },
    },
  },
};

export const CustomTitle: Story = {
  args: {
    title: '나의 러닝',
  },
  parameters: {
    docs: {
      description: {
        story: '타이틀만 변경되는 헤더의 기본 사용 예시입니다.',
      },
    },
  },
};

export const WithBothIcons: Story = {
  args: {
    title: '러닝 코스',
    showLeftIcon: true,
    showRightIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story: '좌/우 아이콘을 모두 표시한 헤더 상태입니다.',
      },
    },
  },
};
