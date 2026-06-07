import Login from '@/components/login';

function safeReturnPath(target: string | string[] | undefined): string {
  const value = Array.isArray(target) ? target[0] : target;
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
