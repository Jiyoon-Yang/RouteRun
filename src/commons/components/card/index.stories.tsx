import { Card } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

type CardProps = React.ComponentProps<typeof Card>;

const meta = {
  title: 'Commons/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    type: 'default',
    isLiked: true,
    isSelected: false,
    title: '한강 러닝 코스',
    location: '여의도 한강공원',
    distanceText: '5km',
    likeCount: 234,
  },
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['default', 'my-course', 'liked-course'],
    },
    isLiked: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    title: { control: 'text' },
    location: { control: 'text' },
    distanceText: { control: 'text' },
    likeCount: { control: { type: 'number', min: 0, step: 1 } },
    className: { control: false },
    onPrimaryActionClick: { action: 'primary-action-click' },
    onSecondaryActionClick: { action: 'secondary-action-click' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '`type`에 따라 기본/마이코스/좋아요 카드가 전환되며, `isSelected`로 보더 강조 상태를 제어합니다.',
      },
    },
  },
} satisfies Meta<CardProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Default: Story = {
  args: {
    type: 'default',
    isLiked: true,
    isSelected: false,
    title: '올림픽 공원 둘레길',
    location: '서울 송파구',
    distanceText: '2.8km',
    likeCount: 10,
  },
};

export const DefaultSelected: Story = {
  args: {
    type: 'default',
    isLiked: true,
    isSelected: true,
    title: '올림픽 공원 둘레길',
    location: '서울 송파구',
    distanceText: '2.8km',
    likeCount: 10,
  },
};

export const MyCourse: Story = {
  args: {
    type: 'my-course',
    isLiked: true,
    title: '한강 러닝 코스',
    location: '여의도 한강공원',
    distanceText: '5km',
    likeCount: 234,
  },
};

export const LikedCourse: Story = {
  args: {
    type: 'liked-course',
    isLiked: true,
    title: '한강 러닝 코스',
    location: '여의도 한강공원',
    distanceText: '5km',
    likeCount: 234,
  },
};

export const AllTypes: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card
        type="default"
        isLiked
        isSelected={false}
        title="올림픽 공원 둘레길"
        location="서울 송파구"
        distanceText="2.8km"
        likeCount={10}
      />
      <Card
        type="my-course"
        isLiked
        title="한강 러닝 코스"
        location="여의도 한강공원"
        distanceText="5km"
        likeCount={234}
      />
      <Card
        type="liked-course"
        isLiked
        title="한강 러닝 코스"
        location="여의도 한강공원"
        distanceText="5km"
        likeCount={234}
      />
    </div>
  ),
};
