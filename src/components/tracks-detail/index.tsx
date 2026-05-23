'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { A11y, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';

import { Badge } from '@/commons/components/badge';
import { Icon } from '@/commons/components/icons';
import { ROUTES } from '@/commons/constants/url';
import { Header } from '@/commons/layout/header';
import { useToast } from '@/commons/providers/toast/toast.provider';
import type { Track } from '@/commons/types/routerun';
import { filterNonemptyImageUrls } from '@/commons/utils/image/filter';
import { getCourseDescriptionDisplay } from '@/commons/utils/text/display';
import TmapTrackDetail from '@/components/tmap/track-detail';

import { TRACKS_DETAIL_COPY as COPY } from './constants/copy';
import { useTrackDetailLikes } from './hooks/use-track-detail-likes';
import styles from './styles.module.css';
import { buildTrackCarouselNavButtonClassNames } from './utils/track-detail-display';

type TracksDetailProps = {
  track: Track;
  authorNickname: string;
  location: string;
  canEdit?: boolean;
};

export function TracksDetail({
  track,
  authorNickname,
  location,
  canEdit = false,
}: TracksDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { isTrackLiked, getTrackLikeCount, toggleTrackLike } = useTrackDetailLikes(track);
  const isLiked = isTrackLiked(track.id);
  const likesCount = getTrackLikeCount(track.id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (searchParams.get('registered') !== 'true') return;
    showToast('트랙 등록이 완료되었습니다!', 'success');
    router.replace(`/tracks/${track.id}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('링크가 복사되었습니다', 'success');
    } catch {
      showToast('링크 복사에 실패했습니다', 'error');
    }
  };

  const descriptionText = getCourseDescriptionDisplay(track.description, COPY.emptyDescription);
  const imageUrls = filterNonemptyImageUrls(track.image_urls);
  const hasImages = imageUrls.length > 0;
  const carouselLabels = imageUrls.map((_, idx) => `트랙 이미지 ${idx + 1}`);
  const { prev: prevButtonClass, next: nextButtonClass } = buildTrackCarouselNavButtonClassNames(
    track.id,
  );

  return (
    <main className={styles.container}>
      <Header
        title="트랙 상세"
        showRightIcon={canEdit}
        rightIconName="pencil"
        rightIconAriaLabel="트랙 수정"
        onRightIconClick={() => {
          router.push(ROUTES.TRACKS.EDIT(track.id));
        }}
        onLeftIconClick={() => {
          router.back();
        }}
      />
      <div className={styles.scrollArea}>
        <section className={styles.mapPreview} aria-label={COPY.mapPreview}>
          <TmapTrackDetail key={track.id} track={track} mapLabel={COPY.mapPreview} />
        </section>

        <article className={styles.content}>
          <section className={styles.userSection} aria-label="작성자 정보">
            <div className={styles.userRow}>
              <div className={styles.avatarWrap} aria-hidden>
                <Icon name="userRound" color="var(--color-white-500)" />
              </div>
              <p className={styles.userName}>{authorNickname}</p>
            </div>
          </section>

          <section className={styles.summarySection} aria-label="트랙 요약 정보">
            <div className={styles.titleRow}>
              <div className={styles.titleGroup}>
                <Badge kind="track" size="m" />
                <h2 className={styles.trackTitle}>{track.title}</h2>
              </div>
              <div className={styles.actionsGroup}>
                <button
                  type="button"
                  className={styles.shareButton}
                  aria-label="링크 공유"
                  onClick={handleShare}
                >
                  <Icon name="share2" color="var(--color-grey-500)" />
                </button>
                <button
                  type="button"
                  className={styles.likeButton}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? '트랙 찜 취소' : '트랙 찜하기'}
                  onClick={() => toggleTrackLike(track.id)}
                >
                  <Icon name={isLiked ? 'heartFilled' : 'heart'} color="var(--color-red-500)" />
                  <span className={styles.likeCount}>{likesCount}</span>
                </button>
              </div>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.distance}>거리: {track.distance_meters}m</span>
              <span className={styles.separator} aria-hidden>
                |
              </span>
              <span className={styles.locationWrap}>
                <span className={styles.locationIcon} aria-hidden>
                  <Icon name="mapPin" size={16} color="var(--color-grey-500)" />
                </span>
                <span className={styles.location}>{location}</span>
              </span>
            </div>
          </section>

          <section className={styles.descriptionSection} aria-label={COPY.descriptionTitle}>
            <h3 className={styles.sectionTitle}>{COPY.descriptionTitle}</h3>
            <p className={styles.description}>{descriptionText}</p>
          </section>

          <section className={styles.imageSection} aria-label={COPY.imageTitle}>
            <h3 className={styles.sectionTitle}>{COPY.imageTitle}</h3>
            {hasImages ? (
              <div className={styles.carousel}>
                <div className={styles.carouselViewport}>
                  <Swiper
                    className={styles.carouselTrack}
                    modules={[Navigation, A11y]}
                    spaceBetween={0}
                    slidesPerView={1}
                    navigation={{
                      prevEl: `.${prevButtonClass}`,
                      nextEl: `.${nextButtonClass}`,
                    }}
                    onSlideChange={(swiper) => setActiveSlideIndex(swiper.realIndex)}
                    aria-label="트랙 이미지 캐러셀"
                  >
                    {carouselLabels.map((imageLabel, index) => (
                      <SwiperSlide key={imageLabel} className={styles.carouselSlide}>
                        <figure
                          className={styles.carouselItem}
                          aria-label={`${COPY.imageAltPrefix} ${index + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrls[index]}
                            alt={`${COPY.imageAltPrefix} ${index + 1}`}
                            className={styles.carouselImage}
                          />
                          <span className={styles.carouselCaption}>{imageLabel}</span>
                        </figure>
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  <div className={styles.carouselControls}>
                    <button
                      type="button"
                      className={`${styles.carouselButton} ${prevButtonClass}`}
                      aria-label={COPY.previousImage}
                    >
                      <Icon name="chevronLeft" size={16} color="var(--color-black-900)" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.carouselButton} ${nextButtonClass}`}
                      aria-label={COPY.nextImage}
                    >
                      <Icon name="chevronRight" size={16} color="var(--color-black-900)" />
                    </button>
                  </div>

                  <div className={styles.carouselIndicators} aria-label="이미지 위치 표시">
                    {imageUrls.map((_, index) => (
                      <span
                        key={`indicator-${index + 1}`}
                        className={
                          index === activeSlideIndex ? styles.indicatorActive : styles.indicator
                        }
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyImageCard} role="status" aria-live="polite">
                <p className={styles.emptyImageTitle}>{COPY.emptyImageTitle}</p>
              </div>
            )}
          </section>
        </article>
      </div>
    </main>
  );
}

export default TracksDetail;
