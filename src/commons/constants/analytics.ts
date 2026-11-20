// 서버가 가입을 처리한 뒤 다음 화면에서 GA `sign_up` 이벤트를 보내도록 남기는 쿠키. 값은 'google' | 'guest'
export const SIGNUP_COOKIE = 'ga_signup';
export const SIGNUP_COOKIE_OPTIONS = { maxAge: 60, path: '/' };
