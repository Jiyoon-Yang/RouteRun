// 디자인: Figma node 164:16090 (icon 프레임 심볼 → lucide-react)
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  CircleMinus,
  CirclePlus,
  Heart,
  Home,
  Info,
  LogOut,
  MapPin,
  Minus,
  Pencil,
  RotateCcw,
  Save,
  Scan,
  SquarePlus,
  Trash2,
  UserRound,
} from 'lucide-react';

import styles from './styles.module.css';

const iconRegistry = {
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  circleMinus: CircleMinus,
  circlePlus: CirclePlus,
  heart: Heart,
  house: Home,
  info: Info,
  mapPin: MapPin,
  minus: Minus,
  pencil: Pencil,
  rotateCcw: RotateCcw,
  save: Save,
  scan: Scan,
  squarePlus: SquarePlus,
  trash2: Trash2,
  userRound: UserRound,
  circleCheckBig: CircleCheckBig,
  heartFilled: Heart,
  check: Check,
  circleAlert: CircleAlert,
  logOut: LogOut,
} as const;

export type IconName = keyof typeof iconRegistry;

interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string; // 부모에서 추가적인 CSS 모듈 클래스를 주입할 때 사용
}

export const Icon = ({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className,
}: IconProps) => {
  const LucideComponent = iconRegistry[name];

  if (!LucideComponent) {
    console.warn(`[Icon Component] "${name}" 아이콘이 iconRegistry에 등록되지 않았습니다.`);
    return null;
  }

  const combinedClassName = `${styles.iconBase} ${className || ''}`.trim();

  const filledHeartProps =
    name === 'heartFilled' ? ({ fill: color } as const satisfies Record<string, string>) : {};

  return (
    <LucideComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={combinedClassName}
      {...filledHeartProps}
    />
  );
};

export default Icon;

export { LogoIcon } from './logo';

import type { LucideIcon } from 'lucide-react';

interface FieldLucideIconProps {
  icon: LucideIcon;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function FieldLucideIcon({
  icon: LucideComponent,
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  className,
}: FieldLucideIconProps) {
  return (
    <LucideComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
