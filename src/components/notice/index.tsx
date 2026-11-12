'use client';

import { useRouter } from 'next/navigation';

import { Icon } from '@/commons/components/icons';
import { Header } from '@/commons/layout/header';
import type { Notice } from '@/commons/types/routerun';

import styles from './styles.module.css';

// 서버·브라우저 시간대가 달라도 같은 날짜가 나오도록 KST로 고정한다.
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });

export type NoticeListPageProps = {
  notices: Notice[];
};

export function NoticeListPage({ notices }: NoticeListPageProps) {
  const router = useRouter();

  return (
    <section className={styles.root}>
      <Header
        title="공지사항"
        showLogo={false}
        showRightIcon={false}
        onLeftIconClick={() => router.back()}
      />
      <ul className={styles.list}>
        {notices.map((notice) => (
          <li key={notice.id} className={styles.item}>
            <details>
              <summary className={styles.summary}>
                {notice.pinned && <span className={styles.pinned}>고정</span>}
                <span className={styles.title}>{notice.title}</span>
                <time className={styles.date} dateTime={notice.published_at}>
                  {formatDate(notice.published_at)}
                </time>
                {/* 펼침 여부에 따라 CSS가 둘 중 하나만 보여준다 */}
                <Icon name="chevronDown" size={20} className={styles.chevronDown} />
                <Icon name="chevronUp" size={20} className={styles.chevronUp} />
              </summary>
              <p className={styles.body}>{notice.body}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
