import { notFound, redirect } from 'next/navigation';

import TrackSubmit from '@/components/track-submit';
import { createClient } from '@/lib/supabase/server';
import { fetchTrackDetail } from '@/services/track/trackDetailService';

interface TrackEditPageProps {
  params: { id: string };
}

export default async function TrackEditPage({ params }: TrackEditPageProps) {
  const fetchedData = await fetchTrackDetail(params.id);

  if (!fetchedData) {
    notFound();
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id !== fetchedData.track.user_id) {
    redirect(`/tracks/${params.id}`);
  }

  return <TrackSubmit mode="edit" trackId={params.id} initialData={fetchedData} />;
}
