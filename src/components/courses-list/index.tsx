'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { Card } from '@/commons/components/card';
import { ROUTES } from '@/commons/constants/url';
import type { HomeListItem } from '@/commons/types/routerun';

import { CourseListSortDropdown } from './course-list-sort-dropdown';
import { CoursesListSkeleton } from './courses-list-skeleton';
import { useCourseCardKeyboardSelect } from './hooks/use-course-card-keyboard-select';
import { useCourseListSort } from './hooks/use-course-list-sort';
import {
  useCoursesListBottomSheet,
  type SheetPositionPayload,
} from './hooks/use-courses-list-bottom-sheet';
import { useCoursesListEmptySheetState } from './hooks/use-courses-list-empty-sheet-state';
import styles from './styles.module.css';
import { buildCoursesListSheetRootClassName } from './utils/sheet-root-class-name';

type CoursesListProps = {
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

export function CoursesList({
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
}: CoursesListProps) {
  const { sortMode, displayCards, selectSortMode } = useCourseListSort(
    cards,
    getCourseLikeCount,
    getTrackLikeCount,
  );

  const { isEmpty } = useCoursesListEmptySheetState({
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
  } = useCoursesListBottomSheet({
    openPeekFromCollapsedSignal,
    isEmpty,
    onSheetPositionChange,
  });

  const sheetRootClassName = buildCoursesListSheetRootClassName(sheetState, isDragging, {
    courseList: styles.courseList,
    collapsed: styles.collapsed,
    peek: styles.peek,
    expanded: styles.expanded,
    dragging: styles.dragging,
  });

  const handleCardKeyDown = useCourseCardKeyboardSelect();

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
      <div className={styles.courseListTitleRow}>
        <h2 className={styles.courseListTitle}>러닝코스 목록</h2>
        <CourseListSortDropdown sortMode={sortMode} onSelect={selectSortMode} />
      </div>
      <div ref={cardListRef} className={styles.cardList}>
        {isLoading && cards.length === 0 ? <CoursesListSkeleton /> : null}
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

export default CoursesList;

export type { SheetPositionPayload };
export type { CourseListSortMode } from './utils/sort-course-cards';
