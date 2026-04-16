/**
 * App layout shell — wireframe
 * 상단 헤더(60px)·본문·하단 GNB(56px) flex 구조, 고정 영역 패딩 반영
 */

import styles from './styles.module.css';

export type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.root}>
      <header className={styles.header} aria-label="상단 헤더">
        <div className={styles.headerInner}>Header</div>
      </header>
      <main className={styles.main}>
        <div className={styles.mainInner}>{children}</div>
      </main>
      <nav className={styles.gnb} aria-label="하단 탭 내비게이션">
        <div className={styles.gnbInner}> GNB</div>
      </nav>
    </div>
  );
}

export default Layout;
