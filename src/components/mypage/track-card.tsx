'use client';

import { useRouter } from 'next/navigation';

import { Card } from '@/commons/components/card';
import { ROUTES } from '@/commons/constants/url';
import type { MypageTab, MypageTrackCardData } from '@/commons/types/mypage';

import { deleteTrackAction } from '@/actions/track.action';

import { useDeleteItem } from './hooks/useDeleteItem';

const TRACK_DELETE_CONFIG = {
  confirmTitle: '트랙을 삭제하시겠습니까?',
  successTitle: '트랙이 삭제되었습니다.',
  errorMessage: '트랙 삭제에 실패했습니다. 다시 시도해 주세요.',
  deleteAction: deleteTrackAction,
} as const;

export type TrackCardProps = {
  tab: MypageTab;
  track: MypageTrackCardData;
  isTrackLiked?: (trackId: string) => boolean;
  getTrackLikeCount?: (trackId: string) => number;
  toggleTrackLike?: (trackId: string) => void;
};

export function TrackCard({
  tab,
  track,
  isTrackLiked,
  getTrackLikeCount,
  toggleTrackLike,
}: TrackCardProps) {
  const router = useRouter();
  const { isDeleting, deleteItem: deleteTrack } = useDeleteItem(TRACK_DELETE_CONFIG);
  const isMyTrack = tab === 'my-posts';
  const locationText = track.start_address_region ?? '위치 정보 없음';
  const isLiked = isTrackLiked?.(track.id) ?? false;
  const likeCount = getTrackLikeCount?.(track.id) ?? track.likeCount;

  const secondaryActionLabel = isMyTrack ? undefined : isLiked ? '좋아요 취소' : '좋아요';

  return (
    <Card
      type={isMyTrack ? 'my-course' : 'liked-course'}
      itemKind="track"
      isLiked={isLiked}
      onLikeClick={() => toggleTrackLike?.(track.id)}
      title={track.title}
      location={locationText}
      distanceText={track.distanceText}
      likeCount={likeCount}
      thumbnailUrl={track.thumbnailUrl}
      primaryActionLabel={isMyTrack ? '상세보기' : undefined}
      onPrimaryActionClick={() => {
        router.push(ROUTES.TRACKS.DETAIL(track.id));
      }}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryActionClick={() => {
        if (isMyTrack) {
          deleteTrack(track.id);
        } else {
          toggleTrackLike?.(track.id);
        }
      }}
      secondaryActionDisabled={isMyTrack && isDeleting}
    />
  );
}
