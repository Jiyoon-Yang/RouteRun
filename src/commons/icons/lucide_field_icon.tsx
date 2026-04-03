import type { LucideIcon } from 'lucide-react';

/** 폼 필드·인라인 아이콘 슬롯(보통 20×20)에 맞춘 기본 크기 */
export const FIELD_LUCIDE_ICON_SIZE = 20;

/** 필드 UI용 선 두께 */
export const FIELD_LUCIDE_STROKE_WIDTH = 1.75;

export type FieldLucideIconProps = {
  icon: LucideIcon;
  /** 기본값 `FIELD_LUCIDE_ICON_SIZE` */
  size?: number;
  /** 기본값 `FIELD_LUCIDE_STROKE_WIDTH` */
  strokeWidth?: number;
};

/**
 * 팀에서 사용하는 `lucide-react` 아이콘을 필드 슬롯에 맞게 렌더링한다.
 * 색은 부모의 `color` / `currentColor`를 따른다.
 */
export function FieldLucideIcon({
  icon: Icon,
  size = FIELD_LUCIDE_ICON_SIZE,
  strokeWidth = FIELD_LUCIDE_STROKE_WIDTH,
}: FieldLucideIconProps) {
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden />;
}
