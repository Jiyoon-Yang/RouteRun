export function buildTrackCarouselNavButtonClassNames(trackId: string): {
  prev: string;
  next: string;
} {
  const safeToken = trackId.replace(/[^a-zA-Z0-9_-]/g, '-');
  return {
    prev: `track-detail-prev-${safeToken}`,
    next: `track-detail-next-${safeToken}`,
  };
}
