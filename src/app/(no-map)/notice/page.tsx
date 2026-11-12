import { NoticeListPage } from '@/components/notice';
import { StaticInfoPage } from '@/components/report';
import { createClient } from '@/lib/supabase/server';
import { fetchNotices } from '@/services/notice/noticeService';

// 쿠키를 읽는 서버 클라이언트라 요청마다 렌더된다 → 어드민(별도 앱)에서 게시하면 바로 보인다.
export default async function NoticePage() {
  const notices = await fetchNotices(createClient());

  if (!notices) {
    return (
      <StaticInfoPage
        title="공지사항"
        description="공지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      />
    );
  }

  if (notices.length === 0) {
    return <StaticInfoPage title="공지사항" description="등록된 공지가 없습니다." />;
  }

  return <NoticeListPage notices={notices} />;
}
