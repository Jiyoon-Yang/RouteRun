export const MAX_POST_TITLE_LENGTH = 100;
export const MAX_POST_DESCRIPTION_LENGTH = 1000;
export const MAX_POST_IMAGES = 5;

type ValidPostInput = {
  title: string;
  description: string | null;
  imageUrls: string[];
};

/**
 * 코스·트랙 등록/수정 서버 액션 공통 입력 검사 (클라이언트 값은 신뢰하지 않는다).
 * 실패 시 사용자에게 보여줄 메시지를 돌려준다.
 */
export function validatePostInput(input: {
  title: unknown;
  description?: unknown;
  imageUrls: unknown;
}): { data: ValidPostInput; error: null } | { data: null; error: string } {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) {
    return { data: null, error: '제목을 입력해 주세요.' };
  }
  if (title.length > MAX_POST_TITLE_LENGTH) {
    return { data: null, error: `제목은 ${MAX_POST_TITLE_LENGTH}자 이하로 입력해 주세요.` };
  }

  const description =
    typeof input.description === 'string' && input.description.trim().length > 0
      ? input.description.trim()
      : null;
  if (description && description.length > MAX_POST_DESCRIPTION_LENGTH) {
    return {
      data: null,
      error: `설명은 ${MAX_POST_DESCRIPTION_LENGTH}자 이하로 입력해 주세요.`,
    };
  }

  const { imageUrls } = input;
  if (!Array.isArray(imageUrls) || !imageUrls.every((url) => typeof url === 'string')) {
    return { data: null, error: '이미지 URL 목록 형식이 올바르지 않습니다.' };
  }
  if (imageUrls.length > MAX_POST_IMAGES) {
    return { data: null, error: `이미지는 ${MAX_POST_IMAGES}장까지 등록할 수 있습니다.` };
  }

  return { data: { title, description, imageUrls }, error: null };
}
