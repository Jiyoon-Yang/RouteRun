// types/runroute.ts
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  profile_image_url?: string;
}

export interface Route {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  distance_meters: number;
  path_data: Record<string, unknown>; // Tmap 경로 JSON 데이터
  start_lat: number;
  start_lng: number;
  image_urls: string[];
  likes_count: number;
  created_at: string;
}

export type ReferenceLocationType = 'CURRENT_USER_LOCATION' | 'SEOUL_CITY_HALL_DEFAULT';

export interface ReferenceLocation {
  type: ReferenceLocationType;
  lat: number;
  lng: number;
}

export interface CourseCardView {
  courseId: string;
  title: string;
  location: string;
  distanceKm: number;
  distanceFromReference: number;
  distanceText: string;
  isPinnedTop: boolean;
}
