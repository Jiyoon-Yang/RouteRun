'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { Card } from '@/commons/components/card';
import { ROUTES } from '@/commons/constants/url';
import type { HomeListItem } from '@/commons/types/routerun';

import { HomeListSkeleton } from './home-list-skeleton';
import { HomeListSortDropdown } from './home-list-sort-dropdown';
import { useHomeListBottomSheet, type SheetPositionPayload } from './hooks/useHomeListBottomSheet';
import { useHomeListEmptySheetState } from './hooks/useHomeListEmptySheetState';
import { useHomeListSort } from './hooks/useHomeListSort';
import { useItemCardKeyboardSelect } from './hooks/useItemCardKeyboardSelect';
import styles from './styles.module.css';
import { buildHomeListSheetRootClassName } from './utils/sheet-root-class-name';

type HomeListProps = {
  cards?: HomeListItem[];
  isLoading?: boolean;
  /** false면 아직 조회 뷰포트 없음 — 빈 목록으로 시트 접힘 고정하지 않음 */
  isRouteQueryViewportReady?: boolean;
  isCourseLiked?: (courseId: string) => boolean;
  getCourseLikeCount?: (courseId: string) => number;
  toggleCourseLike?: (courseId: string) => void;
  isTrackLiked?: (trackId: string) => boolean;
  getTrackLikeCount?: (trackId: string) => number;
  toggleTrackLike?: (trackId: string) => void;
  openPeekFromCollapsedSignal?: number;
  onSheetPositionChange?: (payload: SheetPositionPayload) => void;
  onCourseSelect?: (courseId: string) => void;
  onTrackSelect?: (trackId: string) => void;
};

export function HomeList({
  cards = [],
  isLoading = false,
  isRouteQueryViewportReady = true,
  isCourseLiked,
  getCourseLikeCount,
  toggleCourseLike,
  isTrackLiked,
  getTrackLikeCount,
  toggleTrackLike,
  openPeekFromCollapsedSignal,
  onSheetPositionChange,
  onCourseSelect,
  onTrackSelect,
}: HomeListProps) {
  const { sortMode, displayCards, selectSortMode } = useHomeListSort(
    cards,
    getCourseLikeCount,
    getTrackLikeCount,
  );

  const { isEmpty } = useHomeListEmptySheetState({
    listLength: displayCards.length,
    isLoading,
    isRouteQueryViewportReady,
  });

  const {
    sheetRef,
    cardListRef,
    sheetState,
    isDragging,
    handleToggleByClick,
    handlePan,
    handlePanEnd,
    handleHandleKeyDown,
    handlePanStart,
  } = useHomeListBottomSheet({
    openPeekFromCollapsedSignal,
    isEmpty,
    onSheetPositionChange,
  });

  const sheetRootClassName = buildHomeListSheetRootClassName(sheetState, isDragging, {
    homeList: styles.homeList,
    collapsed: styles.collapsed,
    peek: styles.peek,
    expanded: styles.expanded,
    dragging: styles.dragging,
  });

  const handleCardKeyDown = useItemCardKeyboardSelect();

  return (
    <div ref={sheetRef} className={sheetRootClassName}>
      <motion.div
        className={styles.bottomSheetHandleArea}
        role="button"
        tabIndex={0}
        aria-label="러닝코스 목록 바텀시트 조절"
        onClick={handleToggleByClick}
        onKeyDown={handleHandleKeyDown}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        <div className={styles.bottomSheetHandle} />
      </motion.div>
      <div className={styles.homeListTitleRow}>
        <h2 className={styles.homeListTitle}>러닝코스 목록</h2>
        <HomeListSortDropdown sortMode={sortMode} onSelect={selectSortMode} />
      </div>
      <div ref={cardListRef} className={styles.cardList}>
        {isLoading && cards.length === 0 ? <HomeListSkeleton /> : null}
        {displayCards.map((item) => {
          if (item.itemType === 'course') {
            const card = item.data;
            return (
              <Link
                key={`course-${card.courseId}`}
                href={ROUTES.COURSES.DETAIL(card.courseId)}
                className={styles.cardLink}
                aria-label={`${card.title} 코스 선택`}
                onClick={() => onCourseSelect?.(card.courseId)}
                onKeyDown={handleCardKeyDown}
              >
                <Card
                  className={styles.cardWidth}
                  type="default"
                  itemKind="course"
                  isLiked={isCourseLiked?.(card.courseId) ?? false}
                  isSelected={card.isPinnedTop}
                  title={card.title}
                  location={card.location}
                  distanceText={card.distanceText}
                  likeCount={getCourseLikeCount?.(card.courseId) ?? card.likeCount}
                  thumbnailUrl={card.thumbnailUrl}
                  onLikeClick={() => toggleCourseLike?.(card.courseId)}
                />
              </Link>
            );
          }

          const track = item.data;
          return (
            <Link
              key={`track-${track.trackId}`}
              href={ROUTES.TRACKS.DETAIL(track.trackId)}
              className={styles.cardLink}
              aria-label={`${track.title} 트랙 선택`}
              onClick={() => onTrackSelect?.(track.trackId)}
              onKeyDown={handleCardKeyDown}
            >
              <Card
                className={styles.cardWidth}
                type="default"
                itemKind="track"
                isLiked={isTrackLiked?.(track.trackId) ?? false}
                isSelected={track.isSelected}
                title={track.title}
                location={track.location}
                distanceText={`${track.distanceMeters}m`}
                likeCount={getTrackLikeCount?.(track.trackId) ?? track.likeCount}
                thumbnailUrl={track.thumbnailUrl}
                onLikeClick={() => toggleTrackLike?.(track.trackId)}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default HomeList;

export type { SheetPositionPayload };
export type { HomeListSortMode } from './utils/sort-home-list';
