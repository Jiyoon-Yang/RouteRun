import { Button } from '@/commons/components/button';
import { Icon } from '@/commons/components/icons';

import styles from './styles.module.css';

const DEFAULT_THUMBNAIL_SRC =
  '/Users/MeJoo/Desktop/Running_Course/.cursor-assets/90515084e4c71e385e1f075bf7c074292980bd07.png';

export type CardType = 'default' | 'my-course' | 'liked-course';

export type CardProps = {
  className?: string;
  type: CardType;
  isLiked: boolean;
  isSelected: boolean;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  title?: string;
  location?: string;
  distanceText?: string;
  likeCount?: number;
  onPrimaryActionClick?: () => void;
  onSecondaryActionClick?: () => void;
};

export function Card({
  className,
  type,
  isLiked,
  isSelected,
  thumbnailSrc = DEFAULT_THUMBNAIL_SRC,
  thumbnailAlt = '러닝 코스 썸네일',
  title = '한강 러닝 코스',
  location = '여의도 한강공원',
  distanceText = '5km',
  likeCount = 234,
  onPrimaryActionClick,
  onSecondaryActionClick,
}: CardProps) {
  const showActions = type === 'my-course' || type === 'liked-course';

  const rootClass = [
    styles.root,
    showActions ? styles.rootWithActions : styles.rootDefault,
    isSelected ? styles.selected : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={rootClass}>
      <section className={styles.topSection}>
        <div className={styles.thumbnailWrap}>
          <img src={thumbnailSrc} alt={thumbnailAlt} className={styles.thumbnailImage} />
        </div>

        <div className={styles.content}>
          <div className={styles.contentInfo}>
            <div className={styles.contentTop}>
              <h3 className={styles.title}>{title}</h3>
              <div className={styles.likeWrap}>
                <Icon
                  name={isLiked ? 'heartFilled' : 'heart'}
                  size={1}
                  color={isLiked ? 'var(--color-red-500)' : 'var(--color-dark_grey-300)'}
                  className={styles.likeIcon}
                />
                <span className={styles.likeCount}>{likeCount}</span>
              </div>
            </div>

            <div className={styles.locationWrap}>
              <Icon
                name="mapPin"
                size={1}
                color="var(--color-black-300)"
                className={styles.locationIcon}
              />
              <span className={styles.location}>{location}</span>
            </div>
          </div>

          <p className={styles.distance}>{distanceText}</p>
        </div>
      </section>

      {showActions ? (
        <section className={styles.actions} aria-label="카드 액션">
          <Button
            variant="outline"
            borderRadius="r12"
            size="small"
            color="dark"
            className={styles.actionButton}
            leftIcon={
              type === 'my-course' ? (
                <Icon name="pencil" size={1.125} color="var(--color-black-300)" strokeWidth={1.8} />
              ) : undefined
            }
            onClick={onPrimaryActionClick}
          >
            {type === 'my-course' ? '수정' : '상세보기'}
          </Button>

          <Button
            variant="outline"
            borderRadius="r12"
            size="small"
            color="red"
            className={styles.actionButton}
            leftIcon={
              type === 'my-course' ? (
                <Icon name="trash2" size={1.125} color="var(--color-red-500)" strokeWidth={1.8} />
              ) : (
                <Icon name="heart" size={1.125} color="var(--color-red-500)" strokeWidth={1.8} />
              )
            }
            onClick={onSecondaryActionClick}
          >
            {type === 'my-course' ? '삭제' : '좋아요 취소'}
          </Button>
        </section>
      ) : null}
    </article>
  );
}

export default Card;
