import { notFound } from 'next/navigation';

import TracksDetail from '@/components/tracks-detail';
import { createClient } from '@/lib/supabase/server';
import { fetchTrackDetail } from '@/services/track/trackDetailService';

import type { Metadata } from 'next';

interface TrackDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: TrackDetailPageProps): Promise<Metadata> {
  const detail = await fetchTrackDetail(params.id);
  if (!detail) return {};

  const { track, location } = detail;
  const description =
    track.description?.trim() || `${location} 근처의 ${track.distance_meters}m 트랙`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const ogImage = track.image_urls[0] ?? `${baseUrl}/assets/logo/rr-logo.png`;

  return {
    title: `${track.title} | 루트런`,
    description,
    openGraph: {
      title: track.title,
      description,
      locale: 'ko_KR',
      type: 'article',
      images: [{ url: ogImage, alt: track.title }],
    },
  };
}

export default async function TrackDetailPage({ params }: TrackDetailPageProps) {
  const detail = await fetchTrackDetail(params.id);
  if (!detail) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canEdit = user?.id === detail.track.user_id;

  return (
    <TracksDetail
      track={detail.track}
      authorNickname={detail.authorNickname}
      location={detail.location}
      canEdit={canEdit}
    />
  );
}
