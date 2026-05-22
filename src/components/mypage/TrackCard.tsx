'use client';

import { useRouter } from 'next/navigation';

import { Card } from '@/commons/components/card';
import { ROUTES } from '@/commons/constants/url';
import type { MypageTab, MypageTrackCardData } from '@/commons/types/mypage';

import { useDeleteTrack } from './hooks/useDeleteTrack';

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
  const { isDeleting, deleteTrack } = useDeleteTrack();
  const isMyTrack = tab === 'my-posts';
  const locationText = track.start_address_region ?? '위치 정보 없음';
  const isLiked = isTrackLiked?.(track.id) ?? false;
  const likeCount = getTrackLikeCount?.(track.id) ?? track.likeCount;

  const secondaryActionLabel = isMyTrack ? undefined : isLiked ? '좋아요 취소' : '좋아요';

  return (
    <Card
      type={isMyTrack ? 'my-course' : 'liked-course'}
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
