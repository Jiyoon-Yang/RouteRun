import type { PathPoint } from "@/commons/types/admin"
import { cn } from "@/lib/utils"

// 지도 SDK 없이 경로 모양만 보여주는 미리보기. 어드민은 TMap을 로드하지 않는다.
export function RoutePreview({
  path,
  className,
}: {
  path: PathPoint[]
  className?: string
}) {
  const points = path.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")
  const [startX, startY] = path[0]

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label="경로 미리보기"
      className={cn("bg-muted text-chart-1", className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={startX * 100}
        cy={startY * 100}
        r={3}
        className="fill-background stroke-current"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
