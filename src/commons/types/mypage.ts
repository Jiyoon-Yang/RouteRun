export type MypageTab = 'my-posts' | 'liked-posts';

/** 마이페이지 프로필 영역에 표시할 `users` 테이블 기준 필드 */
export interface MypageProfileProps {
  nickname: string;
  profile_image_url: string | null;
}

/** 마이페이지 코스 카드 한 행에 필요한 뷰 모델 */
export interface MypageRouteCardData {
  id: string;
  title: string;
  start_address_region?: string | null;
  distanceText: string;
  likeCount: number;
  thumbnailUrl?: string;
  /** 어드민이 숨긴 글. 작성자 본인 글에서만 true가 내려온다 */
  isHidden: boolean;
  createdAt: string;
}

/** 마이페이지 트랙 카드 한 행에 필요한 뷰 모델 */
export interface MypageTrackCardData {
  id: string;
  title: string;
  start_address_region?: string | null;
  distanceText: string;
  likeCount: number;
  thumbnailUrl?: string;
  /** 어드민이 숨긴 글. 작성자 본인 글에서만 true가 내려온다 */
  isHidden: boolean;
  createdAt: string;
}

export interface MypagePagePayload {
  profile: MypageProfileProps;
  myRoutes: MypageRouteCardData[];
  likedRoutes: MypageRouteCardData[];
  myTracks: MypageTrackCardData[];
  likedTracks: MypageTrackCardData[];
}
