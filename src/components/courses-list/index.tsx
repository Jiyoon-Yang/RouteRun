'use client';

import { motion, type PanInfo } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

import { Card } from '@/commons/components/card';

import styles from './styles.module.css';

const COURSE_ITEMS = [
  { title: '올림픽 공원 둘레길', location: '서울 송파구', distanceText: '2.8km' },
  { title: '올림픽 공원 둘레길', location: '서울 송파구', distanceText: '2.8km' },
  { title: '올림픽 공원 둘레길', location: '서울 송파구', distanceText: '2.8km' },
  { title: '올림픽 공원 둘레길', location: '서울 송파구', distanceText: '2.8km' },
  { title: '올림픽 공원 둘레길', location: '서울 송파구', distanceText: '2.8km' },
  { title: '올림픽 공원 둘레길', location: '서울 송파구', distanceText: '2.8km' },
] as const;

type BottomSheetState = 'collapsed' | 'peek' | 'expanded';

const SHEET_ORDER: BottomSheetState[] = ['collapsed', 'peek', 'expanded'];

type SheetPositionPayload = {
  state: BottomSheetState;
  visibleHeight: number;
};

function getNextState(current: BottomSheetState, direction: 'up' | 'down'): BottomSheetState {
  const currentIndex = SHEET_ORDER.indexOf(current);
  if (direction === 'up') {
    return SHEET_ORDER[Math.min(currentIndex + 1, SHEET_ORDER.length - 1)];
  }
  return SHEET_ORDER[Math.max(currentIndex - 1, 0)];
}

type CoursesListProps = {
  onSheetPositionChange?: (payload: SheetPositionPayload) => void;
};

export function CoursesList({ onSheetPositionChange }: CoursesListProps) {
  const [sheetState, setSheetState] = useState<BottomSheetState>('peek');
  const [peekVisibleHeight, setPeekVisibleHeight] = useState(260);
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const cardListRef = useRef<HTMLDivElement | null>(null);
  const firstCardRef = useRef<HTMLDivElement | null>(null);

  const handleToggleByClick = () => {
    setSheetState((prev) => (prev === 'expanded' ? 'peek' : getNextState(prev, 'up')));
  };

  const handlePanEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const DRAG_THRESHOLD = 36;
    const VELOCITY_THRESHOLD = 360;

    if (info.offset.y <= -DRAG_THRESHOLD || info.velocity.y <= -VELOCITY_THRESHOLD) {
      setSheetState((prev) => getNextState(prev, 'up'));
      return;
    }

    if (info.offset.y >= DRAG_THRESHOLD || info.velocity.y >= VELOCITY_THRESHOLD) {
      setSheetState((prev) => getNextState(prev, 'down'));
    }
  };

  const handleHandleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleByClick();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSheetState((prev) => getNextState(prev, 'up'));
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSheetState((prev) => getNextState(prev, 'down'));
    }
  };

  useEffect(() => {
    const recalculateSheetHeights = () => {
      const sheetElement = sheetRef.current;
      const cardListElement = cardListRef.current;
      const firstCardElement = firstCardRef.current;

      if (!sheetElement || !cardListElement || !firstCardElement) {
        return;
      }

      const cardHeight = firstCardElement.getBoundingClientRect().height;
      const rowGap = parseFloat(getComputedStyle(cardListElement).rowGap || '12') || 12;
      const sheetHeight = sheetElement.clientHeight;
      setSheetHeight(sheetHeight);
      const fixedTopHeight = sheetHeight - cardListElement.clientHeight;

      const ratioBasedPeekHeight = sheetHeight * 0.32;
      const minPeekListVisibleHeight = cardHeight * 1.45 + rowGap;
      const minPeekHeight = fixedTopHeight + minPeekListVisibleHeight;
      const maxPeekListVisibleHeight = cardHeight * 2.6 + rowGap * 2;
      const maxPeekHeight = fixedTopHeight + maxPeekListVisibleHeight;
      const clampedPeekHeight = Math.min(
        maxPeekHeight,
        Math.max(minPeekHeight, ratioBasedPeekHeight),
      );

      setPeekVisibleHeight(clampedPeekHeight);
    };

    recalculateSheetHeights();

    const resizeObserver = new ResizeObserver(() => {
      recalculateSheetHeights();
    });

    if (sheetRef.current) {
      resizeObserver.observe(sheetRef.current);
    }
    if (cardListRef.current) {
      resizeObserver.observe(cardListRef.current);
    }
    if (firstCardRef.current) {
      resizeObserver.observe(firstCardRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const sheetStyle = {
    '--peek-visible-height': `${peekVisibleHeight}px`,
  } as CSSProperties;

  const sheetY =
    sheetState === 'collapsed'
      ? Math.max(0, sheetHeight - 24)
      : sheetState === 'peek'
        ? Math.max(0, sheetHeight - peekVisibleHeight)
        : 30;

  useEffect(() => {
    onSheetPositionChange?.({
      state: sheetState,
      visibleHeight: Math.max(0, sheetHeight - sheetY),
    });
  }, [onSheetPositionChange, sheetHeight, sheetState, sheetY]);

  return (
    <motion.div
      ref={sheetRef}
      className={styles.courseList}
      style={sheetStyle}
      animate={{ y: sheetY }}
      initial={false}
      transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 1 }}
    >
      <motion.div
        className={styles.bottomSheetHandleArea}
        role="button"
        tabIndex={0}
        aria-label="러닝코스 목록 바텀시트 조절"
        onClick={handleToggleByClick}
        onKeyDown={handleHandleKeyDown}
        onPanEnd={handlePanEnd}
      >
        <div className={styles.bottomSheetHandle} />
      </motion.div>
      <h2 className={styles.courseListTitle}>러닝코스 목록</h2>
      <div ref={cardListRef} className={styles.cardList}>
        {COURSE_ITEMS.map((course, index) => (
          <div key={`${course.title}-${index}`} ref={index === 0 ? firstCardRef : undefined}>
            <Card
              className={styles.cardWidth}
              type="default"
              isLiked
              isSelected={index === 0}
              title={course.title}
              location={course.location}
              distanceText={course.distanceText}
              likeCount={10}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default CoursesList;
