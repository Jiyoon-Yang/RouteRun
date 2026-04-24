'use client';

import { motion, type PanInfo } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

import { Card } from '@/commons/components/card';
import type { CourseCardView } from '@/commons/types/runroute';

import styles from './styles.module.css';

type BottomSheetState = 'collapsed' | 'peek' | 'expanded';

const SHEET_ORDER: BottomSheetState[] = ['collapsed', 'peek', 'expanded'];

type SheetPositionPayload = {
  state: BottomSheetState;
  visibleHeight: number;
};

// [계산] 바텀시트 다음 상태 계산
function getNextState(current: BottomSheetState, direction: 'up' | 'down'): BottomSheetState {
  const currentIndex = SHEET_ORDER.indexOf(current);
  if (direction === 'up') {
    return SHEET_ORDER[Math.min(currentIndex + 1, SHEET_ORDER.length - 1)];
  }
  return SHEET_ORDER[Math.max(currentIndex - 1, 0)];
}

type CoursesListProps = {
  cards?: CourseCardView[];
  isLoading?: boolean;
  onSheetPositionChange?: (payload: SheetPositionPayload) => void;
};

export function CoursesList({
  cards = [],
  isLoading = false,
  onSheetPositionChange,
}: CoursesListProps) {
  // [상태] 바텀시트 표시 상태 관리
  const [sheetState, setSheetState] = useState<BottomSheetState>('peek');
  const [peekVisibleHeight, setPeekVisibleHeight] = useState(260);
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const cardListRef = useRef<HTMLDivElement | null>(null);
  const firstCardRef = useRef<HTMLDivElement | null>(null);

  // [이벤트] 핸들 클릭 기반 상태 토글
  const handleToggleByClick = () => {
    setSheetState((prev) => (prev === 'expanded' ? 'peek' : getNextState(prev, 'up')));
  };

  // [이벤트] 드래그 제스처 기반 상태 전환
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

  // [접근성] 키보드 입력 기반 상태 전환
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
    // [레이아웃] 카드 크기 기반 peek 높이 재계산
    const recalculateSheetHeights = () => {
      const sheetElement = sheetRef.current;
      const cardListElement = cardListRef.current;
      const firstCardElement = firstCardRef.current;

      if (!sheetElement || !cardListElement) {
        return;
      }

      const cardHeight = firstCardElement?.getBoundingClientRect().height ?? 144;
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
    // [동기화] 부모 컴포넌트에 시트 위치 전달
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
        {cards.map((card, index) => (
          <div key={card.courseId} ref={index === 0 ? firstCardRef : undefined}>
            <Card
              className={styles.cardWidth}
              type="default"
              isLiked
              isSelected={card.isPinnedTop}
              title={card.title}
              location={card.location}
              distanceText={card.distanceText}
              likeCount={10}
            />
          </div>
        ))}
        {!isLoading && cards.length === 0 ? (
          <p className={styles.emptyState}>표시할 코스가 없습니다.</p>
        ) : null}
      </div>
    </motion.div>
  );
}

export default CoursesList;
