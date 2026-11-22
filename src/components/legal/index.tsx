'use client';

import { useRouter } from 'next/navigation';

import { Header } from '@/commons/layout/header';

import styles from './styles.module.css';

import type { LegalDocument } from './content';

export type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  const router = useRouter();

  return (
    <section className={styles.root}>
      <Header
        title={document.title}
        showLogo={false}
        showRightIcon={false}
        onLeftIconClick={() => router.back()}
      />
      <article className={styles.body}>
        <p className={styles.effectiveDate}>시행일: {document.effectiveDate}</p>
        <p className={styles.paragraph}>{document.intro}</p>
        {document.sections.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2 className={styles.heading}>{section.heading}</h2>
            {section.paragraphs?.map((text) => (
              <p key={text} className={styles.paragraph}>
                {text}
              </p>
            ))}
            {section.items && (
              <ul className={styles.list}>
                {section.items.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
            {section.notes?.map((text) => (
              <p key={text} className={styles.paragraph}>
                {text}
              </p>
            ))}
          </section>
        ))}
      </article>
    </section>
  );
}
