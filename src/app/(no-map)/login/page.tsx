import { isSafeRelativePath } from '@/commons/utils/safe-path';
import Login from '@/components/login';

function safeReturnPath(target: string | string[] | undefined): string {
  const value = Array.isArray(target) ? target[0] : target;
  if (isSafeRelativePath(value)) {
    return value;
  }
  return '/';
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string | string[] };
}) {
  return <Login returnTo={safeReturnPath(searchParams.next)} />;
}
