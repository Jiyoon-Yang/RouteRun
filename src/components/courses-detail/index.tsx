/**
 * Courses — 코스 상세 검색 UI
 * 버전: 2.0.0 · 수정: 2026-04-16
 * 체크리스트:
 * - [x] CSS Module 클래스만 사용
 * - [x] 텍스트 상수 분리
 * - [x] 공용 Icon 컴포넌트만 사용
 * - [x] 인라인 스타일 미사용
 * - [x] 피그마 메타데이터 구조 기준으로 섹션 반영
 * - [x] 캐러셀/찜 상태 UI 반영
 */

import { Icon } from '@/commons/components/icons';
import { Header } from '@/commons/layout/header';

import styles from './styles.module.css';

const COPY = {
  mapPreview: '[MAP PREVIEW]',
  userName: '러너123',
  courseTitle: '한강 러닝 코스',
  distance: '5.2km',
  location: '서울 영등포구',
  likes: '234',
  descriptionTitle: '코스 설명',
  description:
    '한강을 따라 달리는 아름다운 코스입니다. 평탄한 길로 초보자도 쉽게 달릴 수 있으며, 강변의 경치를 즐기며 러닝할 수 있습니다.',
  imageTitle: '코스 이미지',
  imageAltPrefix: '코스 이미지',
  previousImage: '이전 이미지',
  nextImage: '다음 이미지',
} as const;

const COURSE_IMAGES = ['도심 출발 구간', '강변 러닝 구간', '피니시 지점'] as const;

export function Courses() {
  return (
    <main className={styles.container}>
      <Header title="코스 상세" showRightIcon={false} />
      <div className={styles.scrollArea}>
        <section className={styles.mapPreview} aria-label={COPY.mapPreview}>
          <span className={styles.mapLabel}>{COPY.mapPreview}</span>
        </section>

        <article className={styles.content}>
          <section className={styles.userSection} aria-label="작성자 정보">
            <div className={styles.userRow}>
              <div className={styles.avatarWrap} aria-hidden>
                <Icon name="userRound" color="var(--color-white-500)" />
              </div>
              <p className={styles.userName}>{COPY.userName}</p>
            </div>
          </section>

          <section className={styles.summarySection} aria-label="코스 요약 정보">
            <div className={styles.titleBlock}>
              <h2 className={styles.courseTitle}>{COPY.courseTitle}</h2>
              <div className={styles.metaRow}>
                <span className={styles.distance}>{COPY.distance}</span>
                <span className={styles.separator} aria-hidden>
                  |
                </span>
                <span className={styles.locationWrap}>
                  <span className={styles.locationIcon} aria-hidden>
                    <Icon name="mapPin" size={16} color="var(--color-grey-500)" />
                  </span>
                  <span className={styles.location}>{COPY.location}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              className={styles.likeButton}
              aria-pressed={true}
              aria-label="찜한 코스"
            >
              <Icon name="heartFilled" color="var(--color-red-500)" />
              <span className={styles.likeCount}>{COPY.likes}</span>
            </button>
          </section>

          <section className={styles.descriptionSection} aria-label={COPY.descriptionTitle}>
            <h3 className={styles.sectionTitle}>{COPY.descriptionTitle}</h3>
            <p className={styles.description}>{COPY.description}</p>
          </section>

          <section className={styles.imageSection} aria-label={COPY.imageTitle}>
            <h3 className={styles.sectionTitle}>{COPY.imageTitle}</h3>

            <div className={styles.carousel}>
              <div className={styles.carouselViewport}>
                <div className={styles.carouselTrack} aria-label="코스 이미지 캐러셀">
                  {COURSE_IMAGES.map((imageLabel, index) => {
                    const imageClassName = [
                      styles.carouselItem,
                      index === 0 ? styles.carouselItemPrimary : styles.carouselItemSecondary,
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <figure
                        key={imageLabel}
                        className={imageClassName}
                        aria-label={`${COPY.imageAltPrefix} ${index + 1}`}
                      >
                        <span className={styles.carouselCaption}>{imageLabel}</span>
                      </figure>
                    );
                  })}
                </div>

                <div className={styles.carouselControls}>
                  <button
                    type="button"
                    className={styles.carouselButton}
                    aria-label={COPY.previousImage}
                  >
                    <Icon name="chevronLeft" size={16} color="var(--color-black-900)" />
                  </button>
                  <button
                    type="button"
                    className={styles.carouselButton}
                    aria-label={COPY.nextImage}
                  >
                    <Icon name="chevronRight" size={16} color="var(--color-black-900)" />
                  </button>
                </div>

                <div className={styles.carouselIndicators} aria-label="이미지 위치 표시">
                  <span className={styles.indicatorActive} aria-hidden />
                  <span className={styles.indicator} aria-hidden />
                  <span className={styles.indicator} aria-hidden />
                </div>
              </div>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

export default Courses;
