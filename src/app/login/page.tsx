import Login from '@/components/login';

function safeReturnPath(next: string | string[] | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
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
