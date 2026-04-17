export const ROUTES = {
  LOGIN: '/login',
  HOME: '/home',
  COURSES: {
    DETAIL: (id: string | number) => `/courses/${id}`,
    NEW: '/courses/new',
    EDIT: (id: string | number) => `/courses/${id}/edit`,
  },
  MYPAGE: '/mypage',
} as const;

type AccessLevel = 'public' | 'private';

interface RouteConfig {
  path: string | ((id: string | number) => string);
  access: AccessLevel;
  header: boolean;
  navigationBar: boolean;
}

export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  LOGIN: {
    path: ROUTES.LOGIN,
    access: 'public',
    header: false,
    navigationBar: false,
  },
  HOME: {
    path: ROUTES.HOME,
    access: 'public',
    header: true,
    navigationBar: true,
  },
  COURSES_DETAIL: {
    path: ROUTES.COURSES.DETAIL,
    access: 'public',
    header: true,
    navigationBar: true,
  },
  COURSES_NEW: {
    path: ROUTES.COURSES.NEW,
    access: 'private',
    header: true,
    navigationBar: true,
  },
  MYPAGE: {
    path: ROUTES.MYPAGE,
    access: 'private',
    header: true,
    navigationBar: true,
  },
  COURSES_EDIT: {
    path: ROUTES.COURSES.EDIT,
    access: 'private',
    header: true,
    navigationBar: true,
  },
};

export const NAVIGATION_BAR_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.HOME,
  ROUTES.COURSES.NEW,
  ROUTES.MYPAGE,
] as const;

export const HEADER_ROUTES = [ROUTES.HOME, ROUTES.COURSES.NEW, ROUTES.MYPAGE] as const;

export const PRIVATE_ROUTES = [ROUTES.COURSES.NEW, ROUTES.MYPAGE] as const;

/** 동적 라우트 패턴 — header O */
export const HEADER_DYNAMIC_PATTERNS: RegExp[] = [
  /^\/courses\/[^/]+$/,
  /^\/courses\/[^/]+\/edit$/,
];

/** 동적 라우트 패턴 — navigationBar O */
export const NAVIGATION_BAR_DYNAMIC_PATTERNS: RegExp[] = [
  /^\/courses\/[^/]+$/,
  /^\/courses\/[^/]+\/edit$/,
];

/** 동적 라우트 패턴 — 회원전용 */
export const PRIVATE_DYNAMIC_PATTERNS: RegExp[] = [/^\/courses\/[^/]+\/edit$/];
