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
  path_data: any; // Tmap 경로 JSON 데이터
  start_lat: number;
  start_lng: number;
  image_urls: string[];
  likes_count: number;
  created_at: string;
}
