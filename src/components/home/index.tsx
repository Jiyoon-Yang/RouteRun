import { Card } from '@/commons/components/card';
import { TabButton } from '@/commons/components/tab';
import { Header } from '@/commons/layout/header';

import styles from './styles.module.css';

const TAB_ITEMS = [
  { label: '~3km', variant: 'blue' as const, isActive: false },
  { label: '3~5km', variant: 'green' as const, isActive: false },
  { label: '5~10km', variant: 'red' as const, isActive: false },
  { label: '10km~', variant: 'orange' as const, isActive: false },
];

export function Home() {
  return (
    <section className={styles.container}>
      <Header showLogo showLeftIcon={false} showRightIcon={false} title="RouteRun" />
      <div className={styles.tab}>
        <div className={styles.tabScroll}>
          {TAB_ITEMS.map((tab) => (
            <div key={tab.label} className={styles.tabItem} style={{ flexGrow: tab.ratio }}>
              <TabButton variant={tab.variant} isActive={tab.isActive}>
                {tab.label}
              </TabButton>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.map}>
        <span className={styles.mapPlaceholder}>[MAP AREA]</span>
      </div>

      <div className={styles.courseList}>
        <div className={styles.bottomSheetHandle} />
        <div className={styles.cardList}>
          <Card className={styles.cardWidth} type="default" isLiked={false} isSelected={false} />
          <Card className={styles.cardWidth} type="default" isLiked isSelected />
        </div>
      </div>
    </section>
  );
}

export default Home;
