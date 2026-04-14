import { NavigationBar, type NavigationBarLink, type NavigationBarProps } from './index';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { MouseEvent } from 'react';

const DEFAULT_ITEMS: NavigationBarLink[] = [
  { href: '/', label: '홈', icon: 'house' },
  { href: '/tmaptest', label: '코스 등록', icon: 'squarePlus' },
  { href: '/login', label: '마이페이지', icon: 'userRound' },
];

const ACTIVE_HREF_OPTIONS = ['(기본: 첫 탭)', '/', '/tmaptest', '/login'] as const;

type NavigationBarStoryArgs = Omit<NavigationBarProps, 'activeHref'> & {
  /** 컨트롤용: `(기본: 첫 탭)`은 `activeHref` 미지정과 동일 */
  activeHrefChoice: (typeof ACTIVE_HREF_OPTIONS)[number];
};

const mapChoiceToActiveHref = (
  choice: NavigationBarStoryArgs['activeHrefChoice'],
): string | undefined => (choice === '(기본: 첫 탭)' ? undefined : choice);

const withActiveHrefFromChoice = (args: NavigationBarStoryArgs) => {
  const { activeHrefChoice, ...rest } = args;
  return <NavigationBar {...rest} activeHref={mapChoiceToActiveHref(activeHrefChoice)} />;
};

/** 스토리북 iframe에서 `href` 이동이 일어나지 않도록 링크 기본 동작만 막음 */
const blockStoryAnchorNavigation = (e: MouseEvent<HTMLDivElement>) => {
  if ((e.target as HTMLElement).closest('a[href]')) {
    e.preventDefault();
  }
};

const meta = {
  title: 'Commons/NavigationBar',
  component: NavigationBar,
  tags: ['autodocs'],
  args: {
    items: DEFAULT_ITEMS,
    activeHrefChoice: '(기본: 첫 탭)',
  },
  argTypes: {
    activeHrefChoice: {
      name: 'activeHref',
      control: 'select',
      options: [...ACTIVE_HREF_OPTIONS],
      description:
        '`activeHref` 미지정 시 첫 번째 항목이 선택됩니다. 그 외에는 해당 `href`와 일치하는 탭에 `selected`가 적용됩니다.',
    },
    items: {
      control: 'object',
      description: '미지정 시 홈·코스 등록·마이페이지 기본 3탭',
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
          '하단 GNB(375폭 기준). `activeHref`로 현재 경로에 맞는 탭 선택 상태를 표시합니다. variant/size 축은 없습니다. 스토리북에서는 탭(링크) 클릭 시 실제 주소로 이동하지 않습니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 375, maxWidth: '100%' }} onClickCapture={blockStoryAnchorNavigation}>
        <Story />
      </div>
    ),
  ],
  render: withActiveHrefFromChoice,
} satisfies Meta<NavigationBarStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `activeHref`를 바꿔 각 탭이 선택된 시각 상태를 한 화면에서 비교합니다. */
export const ActiveSelection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '선택(Selected) 축만 비교합니다. 실제 `:hover` 등은 링크에 마우스를 올려 확인할 수 있습니다.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'grid', gap: 24, width: 375, maxWidth: '100%' }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-dark_grey-600, #666)' }}>
          activeHref 미지정 → 첫 탭(홈) 선택
        </p>
        <NavigationBar items={DEFAULT_ITEMS} />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-dark_grey-600, #666)' }}>
          activeHref: /tmaptest
        </p>
        <NavigationBar items={DEFAULT_ITEMS} activeHref="/tmaptest" />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-dark_grey-600, #666)' }}>
          activeHref: /login
        </p>
        <NavigationBar items={DEFAULT_ITEMS} activeHref="/login" />
      </div>
    </div>
  ),
};

/** `items`로 탭 구성을 바꾼 예시(2항목). */
export const CustomItems: Story = {
  args: {
    items: [
      { href: '/a', label: '탭 A', icon: 'house' },
      { href: '/b', label: '탭 B', icon: 'mapPin' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '기본 3탭이 아닌 짧은 목록에서도 레이아웃·선택 상태가 맞는지 확인합니다.',
      },
    },
  },
  render: (args) => <NavigationBar className={args.className} items={args.items} activeHref="/b" />,
};
