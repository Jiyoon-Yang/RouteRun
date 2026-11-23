/**
 * 리다이렉트 대상으로 써도 되는 사이트 내부 상대 경로인지 확인한다(open redirect 방지).
 * 브라우저는 `\`를 `/`로 바꾸므로 `/\evil.com`도 `//evil.com`처럼 외부로 나간다.
 */
export function isSafeRelativePath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\')
  );
}
