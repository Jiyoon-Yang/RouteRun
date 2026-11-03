import {
  HistoryIcon,
  ImageIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MapIcon,
  MegaphoneIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { href: string; title: string; icon: LucideIcon }

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "운영",
    items: [
      { href: "/", title: "대시보드", icon: LayoutDashboardIcon },
      { href: "/reports", title: "제보 처리함", icon: InboxIcon },
      { href: "/notices", title: "공지 관리", icon: MegaphoneIcon },
    ],
  },
  {
    label: "콘텐츠",
    items: [
      { href: "/content", title: "코스·트랙 관리", icon: MapIcon },
      { href: "/images", title: "이미지 검수", icon: ImageIcon },
    ],
  },
  {
    label: "사용자",
    items: [
      { href: "/users", title: "유저 관리", icon: UsersIcon },
      { href: "/audit", title: "작업 기록", icon: HistoryIcon },
    ],
  },
]

export const isActive = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href)

export const findNavItem = (pathname: string) =>
  NAV_GROUPS.flatMap((group) => group.items).find((item) =>
    isActive(item.href, pathname)
  )
