import { LegalDocumentPage } from '@/components/legal';
import { TERMS } from '@/components/legal/content';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: '이용약관 | 루트런' };

export default function TermsPage() {
  return <LegalDocumentPage document={TERMS} />;
}
