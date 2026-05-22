import { Card } from '@/commons/components/card';
import type { TrackCardView } from '@/commons/types/routerun';

type TrackCardProps = {
  className?: string;
  track: TrackCardView;
  isLiked: boolean;
  readonlyLike?: boolean;
  onLikeClick?: () => void;
};

export function TrackCard({
  className,
  track,
  isLiked,
  readonlyLike,
  onLikeClick,
}: TrackCardProps) {
  return (
    <Card
      className={className}
      type="default"
      itemKind="track"
      title={track.title}
      location={track.location}
      distanceText={`${track.distanceMeters}m`}
      likeCount={track.likeCount}
      isLiked={isLiked}
      isSelected={false}
      thumbnailUrl={track.thumbnailUrl}
      readonlyLike={readonlyLike}
      onLikeClick={onLikeClick}
    />
  );
}
