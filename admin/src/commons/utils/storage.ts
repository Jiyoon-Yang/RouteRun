// 사용자 앱 src/commons/utils/storage.ts와 같은 규칙. 앱이 나뉘어 있어 import 대신 옮겨 왔다.
export const COURSE_IMAGES_BUCKET = "course_images"

const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${COURSE_IMAGES_BUCKET}/`

/**
 * 글에 저장된 public URL을 버킷 내 경로로 되돌린다.
 * 작성자 폴더(`userId/`) 밖의 파일이면 null — 다른 사람 파일은 지우지 않는다.
 */
export function extractImagePath(url: string, userId: string): string | null {
  const index = url.indexOf(PUBLIC_PATH_MARKER)
  if (index === -1) return null

  const path = url.slice(index + PUBLIC_PATH_MARKER.length).split("?")[0]
  return path.startsWith(`${userId}/`) && !path.includes("..") ? path : null
}
