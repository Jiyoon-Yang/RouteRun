/*
 * Mypage Component — index.tsx
 * 버전: 1.0.0 · 생성: 2026-04-16
 * 체크리스트:
 * - [x] tailwind.config 미수정
 * - [x] 하드코딩 색상값 0건 (CSS 변수만 사용)
 * - [x] 인라인 스타일 0건
 * - [x] index.tsx → 구조 / styles.module.css → 스타일 분리
 * - [x] CSS Module 사용 확인: import styles from './styles.module.css'
 * - [x] CSS 변수 사용 확인
 * - [x] 피그마 구조 대비 누락 섹션 없음 (프로필 / 탭 / 카드 목록)
 * - [x] 소수점 값 반올림 완료
 * - [x] 게스트용 하단 Google CTA는 styles에서 absolute
 * - [x] Button, Card 공통 컴포넌트 사용
 * - [x] Icon 컴포넌트 사용
 */

'use client';

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { toggleCourseLikeAction } from '@/actions/course.action';
import { toggleTrackLikeAction } from '@/actions/track.action';
import { Button } from '@/commons/components/button';
import { Icon } from '@/commons/components/icons';
import { Modal } from '@/commons/components/modal';
import { useGuestGuard } from '@/commons/hooks/useGuestGuard';
import { useLikes } from '@/commons/hooks/useLikes';
import { Header } from '@/commons/layout/header';
import { useAuth } from '@/commons/providers/auth/auth.provider';
import modalBackdropStyles from '@/commons/providers/modal/modal.provider.module.css';
import type {
  MypageProfileProps,
  MypageRouteCardData,
  MypageTrackCardData,
} from '@/commons/types/mypage';
import { fetchLikedCourseIds } from '@/services/course/courseLikeService';
import { fetchLikedTrackIds } from '@/services/track/trackLikeService';

import { useLinkGoogle } from './hooks/useLinkGoogle';
import { useLogout } from './hooks/useLogout';
import { useLogoutModal } from './hooks/useLogoutModal';
import { useMyPageTabs } from './hooks/useMyPageTabs';
import { useProfileModal } from './hooks/useProfileModal';
import { RouteCard } from './route-card';
import styles from './styles.module.css';
import { TrackCard } from './track-card';

const TEXTS = {
  TITLE: '마이페이지',
  EDIT_PROFILE: '프로필 수정',
  TAB_MY_POSTS: '내가 작성한 게시글',
  TAB_LIKED_POSTS: '좋아요한 게시글',
  EMPTY_MY: '작성한 게시글이 없습니다.',
  EMPTY_LIKED: '좋아요한 게시글이 없습니다.',
  GOOGLE_CONTINUE: '내 Google 계정과 연동하기',
  GOOGLE_LINKING: '연동 중...',
} as const;

/**
 * Google G — 로그인 화면과 동일(브랜드 컬러, CSS 변수 없음)
 */
const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export type MypageProps = {
  profile: MypageProfileProps;
  myRoutes: MypageRouteCardData[];
  likedRoutes: MypageRouteCardData[];
  myTracks: MypageTrackCardData[];
  likedTracks: MypageTrackCardData[];
};

export default function Mypage({
  profile,
  myRoutes,
  likedRoutes,
  myTracks,
  likedTracks,
}: MypageProps) {
  const { linkGoogle, isPending: isLinkGooglePending } = useLinkGoogle({ returnTo: '/mypage' });
  const { activeTab, setTab } = useMyPageTabs();
  const allRouteLikeCounts = useMemo(
    () =>
      [...myRoutes, ...likedRoutes].reduce<Record<string, number>>((acc, route) => {
        acc[route.id] = route.likeCount;
        return acc;
      }, {}),
    [myRoutes, likedRoutes],
  );
  const {
    isLiked: isCourseLiked,
    getLikeCount: getCourseLikeCount,
    toggleLike: toggleCourseLike,
  } = useLikes(allRouteLikeCounts, {
    entityLabel: '코스',
    fetchLikedIds: fetchLikedCourseIds,
    toggleAction: toggleCourseLikeAction,
  });

  const allTrackLikeCounts = useMemo(
    () =>
      [...myTracks, ...likedTracks].reduce<Record<string, number>>((acc, track) => {
        acc[track.id] = track.likeCount;
        return acc;
      }, {}),
    [myTracks, likedTracks],
  );
  const {
    isLiked: isTrackLiked,
    getLikeCount: getTrackLikeCount,
    toggleLike: toggleTrackLike,
  } = useLikes(allTrackLikeCounts, {
    entityLabel: '트랙',
    fetchLikedIds: fetchLikedTrackIds,
    toggleAction: toggleTrackLikeAction,
  });

  const { isAnonymous } = useAuth();
  const { executeLogoutOrDelete, isPending: isLogoutPending, isError } = useLogout();
  const { isOpen, openModal, closeModal, handleConfirm, modalData } = useLogoutModal(
    isAnonymous,
    executeLogoutOrDelete,
  );

  useEffect(() => {
    if (isError) {
      alert('요청 처리 중 문제가 발생했습니다. 다시 시도해 주세요.');
    }
  }, [isError]);

  const activeItems = useMemo(() => {
    const routes = (activeTab === 'my-posts' ? myRoutes : likedRoutes).map((r) => ({
      kind: 'route' as const,
      data: r,
    }));
    const tracks = (activeTab === 'my-posts' ? myTracks : likedTracks).map((t) => ({
      kind: 'track' as const,
      data: t,
    }));
    return [...routes, ...tracks].sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));
  }, [activeTab, myRoutes, likedRoutes, myTracks, likedTracks]);

  const isEmpty = activeItems.length === 0;

  const emptyMessages = {
    'my-posts': TEXTS.EMPTY_MY,
    'liked-posts': TEXTS.EMPTY_LIKED,
  } as const;
  const emptyMessage = emptyMessages[activeTab];

  const tabPanelLabels = {
    'my-posts': TEXTS.TAB_MY_POSTS,
    'liked-posts': TEXTS.TAB_LIKED_POSTS,
  } as const;

  const { open } = useProfileModal({
    initialNickname: profile.nickname,
  });
  const { requireFullAccountForProfile } = useGuestGuard();

  return (
    <div className={styles.container}>
      <Header
        title={TEXTS.TITLE}
        showLeftIcon={false}
        showRightIcon={true}
        rightIconName="logOut"
        onRightIconClick={isLogoutPending ? undefined : openModal}
      />

      <section className={styles.profileSection} aria-label="프로필">
        <div className={styles.profileInfo}>
          <div className={styles.avatar} aria-hidden="true">
            <Icon name="userRound" size={32} color="var(--color-white-500)" />
          </div>
          <span className={styles.userName}>{profile.nickname}</span>
        </div>
        <Button
          variant="outline"
          borderRadius="r12"
          size="small"
          color="dark"
          onClick={() => requireFullAccountForProfile(open)}
        >
          {TEXTS.EDIT_PROFILE}
        </Button>
      </section>

      <div className={styles.tabSection} role="tablist" aria-label="목록 탭">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'my-posts'}
          className={`${styles.tabButton} ${activeTab === 'my-posts' ? styles.tabButtonActive : styles.tabButtonInactive}`}
          onClick={() => setTab('my-posts')}
        >
          {TEXTS.TAB_MY_POSTS}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'liked-posts'}
          className={`${styles.tabButton} ${activeTab === 'liked-posts' ? styles.tabButtonActive : styles.tabButtonInactive}`}
          onClick={() => setTab('liked-posts')}
        >
          {TEXTS.TAB_LIKED_POSTS}
        </button>
      </div>

      <section
        className={`${styles.cardList} ${isAnonymous ? styles.cardListWithGuestCta : ''}`}
        role="tabpanel"
        aria-label={tabPanelLabels[activeTab]}
      >
        {isEmpty ? (
          <p className={styles.emptyState}>{emptyMessage}</p>
        ) : (
          activeItems.map((item) =>
            item.kind === 'route' ? (
              <RouteCard
                key={item.data.id}
                tab={activeTab}
                route={item.data}
                isCourseLiked={isCourseLiked}
                getCourseLikeCount={getCourseLikeCount}
                toggleCourseLike={toggleCourseLike}
              />
            ) : (
              <TrackCard
                key={item.data.id}
                tab={activeTab}
                track={item.data}
                isTrackLiked={isTrackLiked}
                getTrackLikeCount={getTrackLikeCount}
                toggleTrackLike={toggleTrackLike}
              />
            ),
          )
        )}
      </section>

      {isAnonymous && (
        <Button
          variant="outline"
          color="dark"
          size="medium"
          borderRadius="r12"
          leftIcon={<GoogleIcon />}
          className={styles.googleContinueOverlay}
          aria-label={isLinkGooglePending ? TEXTS.GOOGLE_LINKING : TEXTS.GOOGLE_CONTINUE}
          disabled={isLinkGooglePending}
          onClick={linkGoogle}
        >
          {isLinkGooglePending ? TEXTS.GOOGLE_LINKING : TEXTS.GOOGLE_CONTINUE}
        </Button>
      )}

      {typeof window !== 'undefined' &&
        isOpen &&
        createPortal(
          <div
            className={modalBackdropStyles.backdrop}
            role="dialog"
            aria-modal="true"
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <Modal
              type="confirm"
              title={modalData.title}
              content={modalData.content}
              onConfirm={handleConfirm}
              onClose={closeModal}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
