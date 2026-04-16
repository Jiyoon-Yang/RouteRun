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
 * - [x] flexbox만 사용 (position: absolute 금지)
 * - [x] Button, Card 공통 컴포넌트 사용
 * - [x] Icon 컴포넌트 사용
 */

'use client';

import { useState } from 'react';

import { Button } from '@/commons/components/button';
import { Card } from '@/commons/components/card';
import { Icon } from '@/commons/components/icons';

import styles from './styles.module.css';

// i18n 대비 텍스트 상수 분리
const TEXTS = {
  TITLE: '마이페이지',
  USER_NAME: '러닝러버',
  EDIT_PROFILE: '프로필 수정',
  TAB_MY_COURSE: '내가 작성한 코스',
  TAB_LIKED_COURSE: '좋아요한 코스',
} as const;

type TabType = 'my-course' | 'liked-course';

// 샘플 카드 데이터
const MY_COURSES = [
  { id: 1, title: '한강 러닝 코스', location: '여의도 한강공원', distanceText: '5km', likeCount: 234 },
  { id: 2, title: '한강 러닝 코스', location: '여의도 한강공원', distanceText: '5km', likeCount: 234 },
  { id: 3, title: '한강 러닝 코스', location: '여의도 한강공원', distanceText: '5km', likeCount: 234 },
];

const LIKED_COURSES = [
  { id: 1, title: '한강 러닝 코스', location: '여의도 한강공원', distanceText: '5km', likeCount: 234 },
  { id: 2, title: '한강 러닝 코스', location: '여의도 한강공원', distanceText: '5km', likeCount: 234 },
  { id: 3, title: '한강 러닝 코스', location: '여의도 한강공원', distanceText: '5km', likeCount: 234 },
];

export default function Mypage() {
  const [activeTab, setActiveTab] = useState<TabType>('my-course');

  return (
    <div className={styles.container}>
      {/* 프로필 섹션 */}
      <section className={styles.profileSection} aria-label="프로필">
        <div className={styles.profileInfo}>
          <div className={styles.avatar} aria-hidden="true">
            <Icon name="userRound" size={32} color="var(--color-white-500)" strokeWidth={1.5} />
          </div>
          <span className={styles.userName}>{TEXTS.USER_NAME}</span>
        </div>
        <Button
          variant="outline"
          borderRadius="r12"
          size="small"
          color="dark"
          onClick={() => {}}
        >
          {TEXTS.EDIT_PROFILE}
        </Button>
      </section>

      {/* 탭 섹션 */}
      <div className={styles.tabSection} role="tablist" aria-label="코스 목록 탭">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'my-course'}
          className={`${styles.tabButton} ${activeTab === 'my-course' ? styles.tabButtonActive : styles.tabButtonInactive}`}
          onClick={() => setActiveTab('my-course')}
        >
          {TEXTS.TAB_MY_COURSE}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'liked-course'}
          className={`${styles.tabButton} ${activeTab === 'liked-course' ? styles.tabButtonActive : styles.tabButtonInactive}`}
          onClick={() => setActiveTab('liked-course')}
        >
          {TEXTS.TAB_LIKED_COURSE}
        </button>
      </div>

      {/* 카드 목록 섹션 */}
      <section
        className={styles.cardList}
        role="tabpanel"
        aria-label={activeTab === 'my-course' ? TEXTS.TAB_MY_COURSE : TEXTS.TAB_LIKED_COURSE}
      >
        {activeTab === 'my-course' &&
          MY_COURSES.map((course) => (
            <Card
              key={course.id}
              type="my-course"
              isLiked={false}
              title={course.title}
              location={course.location}
              distanceText={course.distanceText}
              likeCount={course.likeCount}
              onPrimaryActionClick={() => {}}
              onSecondaryActionClick={() => {}}
            />
          ))}
        {activeTab === 'liked-course' &&
          LIKED_COURSES.map((course) => (
            <Card
              key={course.id}
              type="liked-course"
              isLiked={true}
              title={course.title}
              location={course.location}
              distanceText={course.distanceText}
              likeCount={course.likeCount}
              onPrimaryActionClick={() => {}}
              onSecondaryActionClick={() => {}}
            />
          ))}
      </section>
    </div>
  );
}
