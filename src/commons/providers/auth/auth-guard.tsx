'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { PRIVATE_DYNAMIC_PATTERNS, PRIVATE_ROUTES } from '@/commons/constants/url';

import { useAuth } from './auth.provider';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPrivateRoute =
    PRIVATE_ROUTES.some((route) => route === pathname) ||
    PRIVATE_DYNAMIC_PATTERNS.some((pattern) => pattern.test(pathname));

  useEffect(() => {
    if (isLoading) return;
    if (!isPrivateRoute) return;
    if (isLoggedIn) return;

    alert('로그인이 필요한 서비스입니다.');
    router.replace(`/login?next=${pathname}`);
  }, [isLoading, isLoggedIn, isPrivateRoute, pathname, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <span className="text-sm text-gray-500">로딩 중...</span>
      </div>
    );
  }

  if (isPrivateRoute && !isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
