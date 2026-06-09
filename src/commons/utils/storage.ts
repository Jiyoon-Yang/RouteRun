import { createClient } from '@/lib/supabase/client';

export const COURSE_IMAGES_BUCKET = 'course_images' as const;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function sanitizeFileSegment(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'image';
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
  return cleaned || 'image';
}

/**
 * 브라우저에서 선택한 이미지 파일들을 Supabase Storage(`course_images`)에 업로드하고
 * public URL 배열을 반환한다. 클라이언트 컴포넌트에서 먼저 호출한 뒤,
 * 반환된 URL을 `SubmitCourseInput.imageUrls` 등에 넘기면 된다.
 */
export async function uploadCourseImages(files: File[]): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new Error('jpg, png, webp, gif 형식의 이미지만 업로드할 수 있습니다.');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`이미지 파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.`);
    }
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const folder = user.id;

  const uploadOne = async (file: File): Promise<string> => {
    const safeName = sanitizeFileSegment(file.name);
    const objectPath = `${folder}/${crypto.randomUUID()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(COURSE_IMAGES_BUCKET)
      .upload(objectPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(COURSE_IMAGES_BUCKET).getPublicUrl(data.path);

    return publicUrl;
  };

  return Promise.all(files.map(uploadOne));
}
