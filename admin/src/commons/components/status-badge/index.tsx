import { Badge } from "@/commons/components/ui/badge"
import {
  REPORT_STATUS_LABEL,
  REPORT_TYPE_LABEL,
} from "@/commons/constants/labels"
import type { ReportStatus, ReportType } from "@/commons/types/admin"

const STATUS_VARIANT = {
  open: "destructive",
  in_progress: "secondary",
  resolved: "outline",
} as const

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {REPORT_STATUS_LABEL[status]}
    </Badge>
  )
}

export function ReportTypeBadge({ type }: { type: ReportType }) {
  return <Badge variant="outline">{REPORT_TYPE_LABEL[type]}</Badge>
}
