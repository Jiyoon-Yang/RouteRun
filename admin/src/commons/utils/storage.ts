// 사용자 앱 src/commons/utils/storage.ts와 같은 버킷 규칙. 앱이 나뉘어 있어 import 대신 옮겨 왔다.
export const COURSE_IMAGES_BUCKET = "course_images"

const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${COURSE_IMAGES_BUCKET}/`

/**
 * 글에 저장된 public URL을 이 프로젝트 버킷 안의 경로로 되돌린다. 다른 호스트·버킷의 URL이면 null.
 * 작성자 폴더 밖이어도 돌려준다. 관리자는 글에 실제로 걸린 파일이면 누구 폴더든 지운다.
 */
export function extractImagePath(url: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "")
  const prefix = `${supabaseUrl}${PUBLIC_PATH_MARKER}`
  // 경로만 같은 다른 Supabase 프로젝트 URL로 우리 파일을 지우지 않게 호스트까지 맞춘다.
  if (!supabaseUrl || !url.startsWith(prefix)) return null

  // getPublicUrl은 encodeURI로 URL을 만들어서, 버킷의 실제 파일 이름으로 되돌린 뒤 지운다. `%2e%2e`도 여기서 `..`가 된다.
  let path: string
  try {
    path = decodeURI(url.slice(prefix.length).split("?")[0])
  } catch {
    return null
  }
  return path && !path.includes("..") ? path : null
}
