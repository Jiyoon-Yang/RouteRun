import { ROUTES } from '@/commons/constants/url';
import { getRouteSitemapEntries } from '@/repositories/course/course.repository';
import { getTrackSitemapEntries } from '@/repositories/track/track.repository';

import type { MetadataRoute } from 'next';

// 홈 지도는 클라이언트에서 코스를 불러와 크롤러가 상세 링크를 찾지 못하므로, 상세 URL은 여기서만 알린다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const [courses, tracks] = await Promise.all([getRouteSitemapEntries(), getTrackSitemapEntries()]);

  return [
    { url: baseUrl },
    { url: `${baseUrl}${ROUTES.NOTICE}` },
    ...courses.map(({ id, lastModified }) => ({
      url: `${baseUrl}${ROUTES.COURSES.DETAIL(id)}`,
      lastModified: lastModified ?? undefined,
    })),
    ...tracks.map(({ id, lastModified }) => ({
      url: `${baseUrl}${ROUTES.TRACKS.DETAIL(id)}`,
      lastModified: lastModified ?? undefined,
    })),
  ];
}
