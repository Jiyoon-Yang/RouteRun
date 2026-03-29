export type TypographyTokenValue = {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: string | number;
  letterSpacing?: string;
};

// Typography tokens:
// - 이 프로젝트에서는 `src/app/globals.css`의 `--typography-<token>-*` CSS 변수를
//   동일 토큰명으로 셋업하고, TS에서는 여기의 `TYPOGRAPHY_TOKENS`로 단일 소스를 맞춥니다.
//
// - 현재 값은 제공된 typography 스케일 이미지 기준(ko)으로 먼저 구현합니다.
// - mobile 값은 이미지에 없어서 desktop 값과 동일하게 기본 세팅해둡니다.
//   (추후 모바일 값이 오면 동일 토큰명을 덮어쓰면 됩니다.)
export const TYPOGRAPHY_TOKENS = {
  // Heading
  'heading-1-ko-desktop': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '24px',
    lineHeight: '30px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'heading-2-ko-desktop': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '20px',
    lineHeight: '26px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'heading-3-ko-desktop-semibold': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '18px',
    lineHeight: '22px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'heading-3-ko-desktop-regular': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '18px',
    lineHeight: '22px',
    fontWeight: 400,
    letterSpacing: '0px',
  },

  // Body
  'body-1-ko-desktop': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'body-2-ko-desktop-semibold': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'body-2-ko-desktop-regular': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
    letterSpacing: '0px',
  },

  // Caption
  'caption-1-ko-desktop': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '12px',
    lineHeight: '18px',
    fontWeight: 500,
    letterSpacing: '0px',
  },

  // Mobile (기본값: desktop과 동일. 추후 이미지/스펙이 오면 덮어쓰기)
  'heading-1-ko-mobile': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '24px',
    lineHeight: '30px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'heading-2-ko-mobile': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '20px',
    lineHeight: '26px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'heading-3-ko-mobile-semibold': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '18px',
    lineHeight: '22px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'heading-3-ko-mobile-regular': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '18px',
    lineHeight: '22px',
    fontWeight: 400,
    letterSpacing: '0px',
  },
  'body-1-ko-mobile': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'body-2-ko-mobile-semibold': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 600,
    letterSpacing: '0px',
  },
  'body-2-ko-mobile-regular': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 400,
    letterSpacing: '0px',
  },
  'caption-1-ko-mobile': {
    fontFamily: '"Pretendard", Arial, Helvetica, sans-serif',
    fontSize: '12px',
    lineHeight: '18px',
    fontWeight: 500,
    letterSpacing: '0px',
  },
} as const satisfies Record<string, TypographyTokenValue>;

export type TypographyTokenName = keyof typeof TYPOGRAPHY_TOKENS;

export type TypographyCssVarPart =
  | 'font-family'
  | 'font-size'
  | 'line-height'
  | 'font-weight'
  | 'letter-spacing';

export function cssTypographyVar(token: TypographyTokenName, part: TypographyCssVarPart) {
  return `var(--typography-${token}-${part})` as const;
}
