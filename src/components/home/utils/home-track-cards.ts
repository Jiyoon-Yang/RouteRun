// 홈 리스트에서 Track을 HomeListItem(track 카드)으로 변환

import type { HomeListItem, Track } from '@/commons/types/routerun';

/** Track → 홈 리스트 track 카드 아이템 */
export function buildTrackCardView(track: Track, selectedTrackId: string | null): HomeListItem {
  return {
    itemType: 'track',
    data: {
      trackId: track.id,
      title: track.title,
      location:
        track.start_address_region ??
        `${track.start_lat.toFixed(4)}, ${track.start_lng.toFixed(4)}`,
      distanceMeters: track.distance_meters,
      likeCount: track.likes_count,
      isSelected: track.id === selectedTrackId,
      thumbnailUrl: track.image_urls[0],
    },
  };
}
