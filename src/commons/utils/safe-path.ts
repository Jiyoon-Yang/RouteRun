/**
 * 리다이렉트 대상으로 써도 되는 사이트 내부 상대 경로인지 확인한다(open redirect 방지).
 * 브라우저는 `\`를 `/`로 바꾸고 탭·개행을 지우므로 `/\evil.com`, `/\t/evil.com`도 `//evil.com`처럼 외부로 나간다.
 */
export function isSafeRelativePath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    // eslint-disable-next-line no-control-regex -- 제어문자를 막는 것이 목적이다
    !/[\\\x00-\x1f]/.test(path)
  );
}
