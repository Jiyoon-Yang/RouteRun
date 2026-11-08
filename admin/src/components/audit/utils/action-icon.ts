import {
  BanIcon,
  CircleCheckIcon,
  EyeIcon,
  EyeOffIcon,
  ImageOffIcon,
  MegaphoneIcon,
  UserCheckIcon,
  type LucideIcon,
} from "lucide-react"

import type { LogAction } from "@/commons/types/admin"

export const LOG_ACTION_ICON: Record<LogAction, LucideIcon> = {
  hide_content: EyeOffIcon,
  unhide_content: EyeIcon,
  suspend_user: BanIcon,
  unsuspend_user: UserCheckIcon,
  update_report: CircleCheckIcon,
  publish_notice: MegaphoneIcon,
  delete_image: ImageOffIcon,
}

// 되돌리기 어려운 조치는 눈에 띄게
export const DESTRUCTIVE_ACTIONS: LogAction[] = [
  "hide_content",
  "suspend_user",
  "delete_image",
]
