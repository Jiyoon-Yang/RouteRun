import { redirect } from 'next/navigation';

import { ROUTES } from '@/commons/constants/url';
import { hasAgreedToTerms } from '@/commons/utils/terms-consent';
import { TermsAgree } from '@/components/terms-agree';
import { createClient } from '@/lib/supabase/server';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: '약관 동의 | 루트런', robots: { index: false } };

function safeReturnPath(target: string | string[] | undefined): string {
  const value = Array.isArray(target) ? target[0] : target;
  // /agree로 돌아오면 동의 후 자기 자신으로 무한 리다이렉트되므로 막는다
  const isSafe =
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith(ROUTES.AGREE);
  return isSafe ? value : '/';
}

export default async function AgreePage({
  searchParams,
}: {
  searchParams: { next?: string | string[] };
}) {
  const returnTo = safeReturnPath(searchParams.next);
  const {
    data: { user },
  } = await createClient().auth.getUser();

  if (!user) redirect(ROUTES.LOGIN);
  if (hasAgreedToTerms(user)) redirect(returnTo);

  return <TermsAgree returnTo={returnTo} isAnonymous={user.is_anonymous ?? false} />;
}
