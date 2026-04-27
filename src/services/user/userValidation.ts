const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 10;
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]+$/;

export type NicknameValidation = {
  isValid: boolean;
  message: string | null;
};

export function validateNickname(nickname: string): NicknameValidation {
  const normalizedNickname = nickname.trim();

  if (!normalizedNickname) {
    return { isValid: false, message: '닉네임을 입력해 주세요.' };
  }

  if (
    normalizedNickname.length < NICKNAME_MIN_LENGTH ||
    normalizedNickname.length > NICKNAME_MAX_LENGTH
  ) {
    return { isValid: false, message: '닉네임은 2자 이상 10자 이하로 입력해 주세요.' };
  }

  if (!NICKNAME_REGEX.test(normalizedNickname)) {
    return { isValid: false, message: '닉네임은 한글, 영문, 숫자만 사용할 수 있어요.' };
  }

  return { isValid: true, message: null };
}
