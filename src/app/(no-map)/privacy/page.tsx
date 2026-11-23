import { LegalDocumentPage } from '@/components/legal';
import { PRIVACY } from '@/components/legal/content';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: '개인정보처리방침 | 루트런' };

export default function PrivacyPage() {
  return <LegalDocumentPage document={PRIVACY} />;
}
