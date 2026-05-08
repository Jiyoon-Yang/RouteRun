// 코스 상세 표시용 포맷·이미지 URL·캐러셀 네비 CSS 클래스 토큰

export function formatCourseDistanceKm(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

export function filterNonemptyImageUrls(urls: string[]): string[] {
  return urls.filter((url) => url.trim().length > 0);
}

export function getCourseDescriptionDisplay(
  description: string | null | undefined,
  emptyFallback: string,
): string {
  return description?.trim() || emptyFallback;
}

export function buildCarouselNavButtonClassNames(courseId: string): { prev: string; next: string } {
  const safeToken = courseId.replace(/[^a-zA-Z0-9_-]/g, '-');
  return {
    prev: `course-detail-prev-${safeToken}`,
    next: `course-detail-next-${safeToken}`,
  };
}
