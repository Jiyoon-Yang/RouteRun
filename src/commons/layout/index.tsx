/**
 * Layout — 공통 앱 레이아웃
 * 버전: 1.0.0 · 생성: 2026-04-16
 * 체크리스트:
 * - [x] CSS Module 클래스만 사용
 * - [x] 인라인 스타일 미사용
 * - [x] Header / NavigationBar import 조립
 * - [x] children 영역 flex: 1 / 내부 스크롤
 * - [x] max-width 480px / 화면 중앙 정렬
 */

import { Header } from './header';
import { NavigationBar } from './navigation-bar';
import styles from './styles.module.css';

import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.top}>
          <Header />
        </div>
        <main className={styles.middle}>{children}</main>
        <div className={styles.bottom}>
          <NavigationBar />
        </div>
      </div>
    </div>
  );
}

export default Layout;
