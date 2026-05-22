// 404 페이지 UI 컴포넌트
import Image from 'next/image';
import Link from 'next/link';

import styles from './styles.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.container}>
      <Image
        src="/assets/logo/rr-logo.png"
        alt="루트런 로고"
        width={80}
        height={80}
        className={styles.logo}
      />
      <p className={styles.code}>404</p>
      <p className={styles.title}>길을 잃었어요.</p>
      <p className={styles.description}>찾으시는 페이지가 없습니다.</p>
      <Link href="/home" className={styles.homeLink}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
