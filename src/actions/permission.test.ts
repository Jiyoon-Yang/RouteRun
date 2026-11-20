import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/lib/supabase/server';
import * as courseRepository from '@/repositories/course/course.repository';
import * as reportRepository from '@/repositories/report.repository';
import * as trackRepository from '@/repositories/track/track.repository';
import * as courseService from '@/services/course/courseService';
import type { SubmitCourseInput } from '@/services/course/courseService';
import * as trackService from '@/services/track/trackService';
import type { SubmitTrackInput } from '@/services/track/trackService';

import {
  createCourseAction,
  deleteCourseAction,
  toggleCourseLikeAction,
  updateCourseAction,
} from './course.action';
import { submitReportAction } from './report.action';
import {
  createTrackAction,
  deleteTrackAction,
  toggleTrackLikeAction,
  updateTrackAction,
} from './track.action';

// 세션 상태별로 Server Action이 서버에서 권한을 강제하는지 본다. 게스트 제한 판단(userService)은 실제 코드를 쓰고 작성 수 집계만 목으로 둔다.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/repositories/user.repository', () => ({}));
vi.mock('@/repositories/report.repository', () => ({
  countReportsSince: vi.fn(),
  createReport: vi.fn(),
}));
vi.mock('@/repositories/course/course.repository', () => ({
  createRoute: vi.fn(),
  upsertRouteLike: vi.fn(),
  deleteRouteLike: vi.fn(),
  getRouteLikesCount: vi.fn(),
}));
vi.mock('@/repositories/track/track.repository', () => ({
  upsertTrackLike: vi.fn(),
  deleteTrackLike: vi.fn(),
  getTrackLikesCount: vi.fn(),
}));
vi.mock('@/services/course/courseService', () => ({
  getUserRouteWriteCount: vi.fn(),
  deleteCourse: vi.fn(),
  updateCourse: vi.fn(),
}));
vi.mock('@/services/track/trackService', () => ({
  getUserTrackWriteCount: vi.fn(),
  submitNewTrack: vi.fn(),
  deleteTrack: vi.fn(),
  updateTrack: vi.fn(),
}));

const ID = '11111111-1111-4111-8111-111111111111';
const GUEST = { id: 'guest-1', is_anonymous: true };
const GOOGLE = { id: 'google-1', is_anonymous: false };

const courseInput = {
  title: '한강 러닝',
  description: null,
  imageUrls: [],
  routeData: {
    totalDistanceKm: 5,
    isRoundTrip: false,
    pathData: {},
    startPoint: { lat: 37.5, lng: 127 },
  },
} satisfies SubmitCourseInput;

const trackInput = {
  title: '동네 트랙',
  description: null,
  imageUrls: [],
  trackPoint: { lat: 37.5, lng: 127 },
  distanceMeters: 400,
} satisfies SubmitTrackInput;

function signInAs(user: object | null) {
  vi.mocked(createClient).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  } as never);
}

/** 이 유저가 이미 쓴 코스·트랙 수. null이면 집계 실패 */
function writtenCounts(courses: number | null, tracks: number | null) {
  vi.mocked(courseService.getUserRouteWriteCount).mockResolvedValue({
    count: courses,
    error: courses === null ? new Error('db') : null,
  } as never);
  vi.mocked(trackService.getUserTrackWriteCount).mockResolvedValue({
    count: tracks,
    error: tracks === null ? new Error('db') : null,
  } as never);
}

const GUEST_LIMIT_MESSAGE = '게스트는 코스·트랙을 합산 1개까지만 등록할 수 있습니다.';

const creators = [
  {
    name: '코스',
    create: () => createCourseAction(courseInput),
    insert: () => vi.mocked(courseRepository.createRoute),
  },
  {
    name: '트랙',
    create: () => createTrackAction(trackInput),
    insert: () => vi.mocked(trackService.submitNewTrack),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(courseRepository.createRoute).mockResolvedValue({
    data: { id: 'course-1' },
    error: null,
  } as never);
  vi.mocked(trackService.submitNewTrack).mockResolvedValue({
    data: { id: 'track-1' },
    error: null,
  } as never);
  writtenCounts(0, 0);
});

describe.each(creators)('$name 등록 Server Action 권한', ({ create, insert }) => {
  it('미로그인은 막고 DB에 쓰지 않는다', async () => {
    signInAs(null);
    expect(await create()).toEqual({ success: false, message: '로그인이 필요합니다.' });
    expect(insert()).not.toHaveBeenCalled();
  });

  it('작성 0개인 게스트는 등록할 수 있다', async () => {
    signInAs(GUEST);
    writtenCounts(0, 0);
    expect(await create()).toMatchObject({ success: true });
    expect(insert()).toHaveBeenCalledOnce();
  });

  it.each([
    ['코스 1개', 1, 0],
    ['트랙 1개', 0, 1],
  ])('게스트가 이미 %s를 썼으면(합산 1개) 서버에서 막는다', async (_label, courses, tracks) => {
    signInAs(GUEST);
    writtenCounts(courses, tracks);
    expect(await create()).toEqual({ success: false, message: GUEST_LIMIT_MESSAGE });
    expect(insert()).not.toHaveBeenCalled();
  });

  it('게스트 작성 수 집계가 실패하면 우회되지 않게 막는다', async () => {
    signInAs(GUEST);
    writtenCounts(0, null);
    expect(await create()).toEqual({ success: false, message: GUEST_LIMIT_MESSAGE });
    expect(insert()).not.toHaveBeenCalled();
  });

  it('Google 로그인 유저는 작성 수와 상관없이 등록할 수 있다', async () => {
    signInAs(GOOGLE);
    writtenCounts(3, 3);
    expect(await create()).toMatchObject({ success: true });
    expect(insert()).toHaveBeenCalledOnce();
    expect(courseService.getUserRouteWriteCount).not.toHaveBeenCalled();
  });
});

describe('좋아요 Server Action 권한', () => {
  const likers = [
    {
      name: '코스',
      toggle: () => toggleCourseLikeAction(ID, true),
      upsert: () => vi.mocked(courseRepository.upsertRouteLike),
      count: () => vi.mocked(courseRepository.getRouteLikesCount),
    },
    {
      name: '트랙',
      toggle: () => toggleTrackLikeAction(ID, true),
      upsert: () => vi.mocked(trackRepository.upsertTrackLike),
      count: () => vi.mocked(trackRepository.getTrackLikesCount),
    },
  ];

  it.each(likers)('$name: 미로그인은 막는다', async ({ toggle, upsert }) => {
    signInAs(null);
    expect(await toggle()).toEqual({ likeCount: null, error: '로그인이 필요합니다.' });
    expect(upsert()).not.toHaveBeenCalled();
  });

  it.each(likers)(
    '$name: 게스트도 누를 수 있고, likes_count는 트리거 결과를 읽기만 한다',
    async ({ toggle, upsert, count }) => {
      signInAs(GUEST);
      upsert().mockResolvedValue({ error: null } as never);
      count().mockResolvedValue({ count: 7, error: null } as never);

      expect(await toggle()).toEqual({ likeCount: 7, error: null });
      expect(upsert()).toHaveBeenCalledWith(expect.anything(), GUEST.id, ID);
      // 좋아요 액션이 부를 수 있는 Repository 함수는 좋아요 행 upsert/delete와 카운트 조회뿐(목에 likes_count 쓰기 함수가 없다)
      expect(count()).toHaveBeenCalledOnce();
    },
  );
});

describe('수정·삭제 Server Action 권한', () => {
  it.each([
    [
      '코스 수정',
      () => updateCourseAction({ courseId: ID, title: 't', description: null, image_urls: [] }),
      () => courseService.updateCourse,
    ],
    [
      '트랙 수정',
      () => updateTrackAction({ trackId: ID, title: 't', description: null, image_urls: [] }),
      () => trackService.updateTrack,
    ],
    ['코스 삭제', () => deleteCourseAction(ID), () => courseService.deleteCourse],
    ['트랙 삭제', () => deleteTrackAction(ID), () => trackService.deleteTrack],
  ] as const)('%s: 미로그인은 막고 Service를 부르지 않는다', async (_label, run, service) => {
    signInAs(null);
    expect(await run()).toMatchObject({ success: false });
    expect(service()).not.toHaveBeenCalled();
  });

  it('삭제는 세션 유저 id로만 Service에 넘긴다(본인 글 확인은 Service·RLS)', async () => {
    signInAs(GUEST);
    await deleteCourseAction(ID);
    expect(courseService.deleteCourse).toHaveBeenCalledWith(ID, GUEST.id);
  });
});

describe('제보 Server Action 권한 (reports는 Service Role 전용)', () => {
  it('미로그인은 Service Role 클라이언트를 만들기 전에 막는다', async () => {
    signInAs(null);
    expect(
      await submitReportAction({ type: 'bug', content: '버튼이 눌리지 않아요 확인 부탁' }),
    ).toEqual({
      success: false,
      message: '로그인이 필요합니다.',
    });
    expect(createServiceRoleClient).not.toHaveBeenCalled();
    expect(reportRepository.createReport).not.toHaveBeenCalled();
  });

  it('잘못된 입력도 Service Role 클라이언트를 만들기 전에 막는다', async () => {
    signInAs(GUEST);
    expect(await submitReportAction({ type: 'bug', content: '짧음' })).toMatchObject({
      success: false,
    });
    expect(createServiceRoleClient).not.toHaveBeenCalled();
  });
});
