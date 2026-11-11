"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/commons/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/commons/components/ui/chart"
import { Skeleton } from "@/commons/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/commons/components/ui/table"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/commons/components/ui/toggle-group"
import type { DashboardStats } from "@/commons/types/admin"
import { formatNumber, formatRelative } from "@/commons/utils/format"

import { useDashboardStats } from "./hooks/use-dashboard-stats"
import { SearchStatsCard } from "./search-stats"

const signupConfig = {
  signups: { label: "구글", color: "var(--chart-1)" },
  guests: { label: "게스트", color: "var(--chart-2)" },
} satisfies ChartConfig

const regionConfig = {
  courses: { label: "코스", color: "var(--chart-1)" },
  tracks: { label: "트랙", color: "var(--chart-3)" },
} satisfies ChartConfig

// 숨김 제외(4단계) 문구는 해당 컬럼이 생기면 다시 붙인다.
const KPIS: { label: string; key: keyof DashboardStats["weekly"] }[] = [
  { label: "전체 유저", key: "users" },
  { label: "구글 유저", key: "google" },
  { label: "게스트", key: "guests" },
  { label: "코스", key: "courses" },
  { label: "트랙", key: "tracks" },
]

export function DashboardPage() {
  const { stats, isLoading } = useDashboardStats()
  const [range, setRange] = useState("30")

  if (!isLoading && !stats) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>지표</CardTitle>
            <CardDescription>
              지표를 불러오지 못했습니다. 서버 로그와 SUPABASE_SERVICE_ROLE_KEY
              설정을 확인하세요.
            </CardDescription>
          </CardHeader>
        </Card>
        <SearchStatsCard />
      </>
    )
  }

  const chartData = stats?.daily.slice(-Number(range)) ?? []
  const now = new Date().toISOString()

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {stats ? (
                  formatNumber(stats.totals[kpi.key])
                ) : (
                  <Skeleton className="h-9 w-24" />
                )}
              </CardTitle>
              {stats && (
                <CardAction>
                  <Badge variant="outline">
                    최근 7일 +{formatNumber(stats.weekly[kpi.key])}
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>신규 가입</CardTitle>
            <CardDescription>일별 가입 수 (구글·게스트)</CardDescription>
            <CardAction>
              <ToggleGroup
                variant="outline"
                size="sm"
                value={[range]}
                onValueChange={(value) => value[0] && setRange(value[0])}
              >
                <ToggleGroupItem value="7">7일</ToggleGroupItem>
                <ToggleGroupItem value="30">30일</ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent>
            {stats ? (
              <ChartContainer
                config={signupConfig}
                className="aspect-auto h-64 w-full"
              >
                <AreaChart data={chartData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tickFormatter={(value: string) =>
                      value.slice(5).replace("-", ".")
                    }
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="guests"
                    type="monotone"
                    stackId="a"
                    fill="var(--color-guests)"
                    fillOpacity={0.25}
                    stroke="var(--color-guests)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="signups"
                    type="monotone"
                    stackId="a"
                    fill="var(--color-signups)"
                    fillOpacity={0.25}
                    stroke="var(--color-signups)"
                    strokeWidth={2}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지역별 등록</CardTitle>
            <CardDescription>상위 7개 지역 · 누적</CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <ChartContainer
                config={regionConfig}
                className="aspect-auto h-64 w-full"
              >
                <BarChart
                  data={stats.regions}
                  layout="vertical"
                  margin={{ left: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  {/* 축에는 구 이름만, 툴팁에는 "서울특별시 송파구" 전체 */}
                  <YAxis
                    dataKey="region"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(value: string) => value.split(" ").pop()!}
                  />
                  {/* 자동 도메인이 누적 합계를 반영하지 않아 막대가 잘려서 직접 지정 */}
                  <XAxis
                    type="number"
                    hide
                    domain={[
                      0,
                      Math.max(
                        1,
                        ...stats.regions.map((row) => row.courses + row.tracks)
                      ),
                    ]}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="courses"
                    stackId="a"
                    fill="var(--color-courses)"
                    stroke="var(--card)"
                    strokeWidth={2}
                    radius={[4, 0, 0, 4]}
                  />
                  <Bar
                    dataKey="tracks"
                    stackId="a"
                    fill="var(--color-tracks)"
                    stroke="var(--card)"
                    strokeWidth={2}
                    radius={[0, 4, 4, 0]}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <SearchStatsCard />

      <Card>
        <CardHeader>
          <CardTitle>최근 등록</CardTitle>
          <CardDescription>
            코스·트랙 최신 6건
            {stats && (
              <>
                {" "}
                · 미처리 제보{" "}
                <Link href="/reports" className="underline underline-offset-4">
                  {formatNumber(stats.pendingReports)}건
                </Link>
              </>
            )}
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/content" />}
              nativeButton={false}
            >
              전체 보기
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {stats ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>유형</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>지역</TableHead>
                  <TableHead className="text-right">좋아요</TableHead>
                  <TableHead className="text-right">등록</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent.map((content) => (
                  <TableRow key={`${content.kind}-${content.id}`}>
                    <TableCell>
                      <Badge variant="outline">
                        {content.kind === "course" ? "코스" : "트랙"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate font-medium">
                      {content.title}
                    </TableCell>
                    <TableCell>
                      {content.author.nickname}
                      {content.author.isAnonymous && (
                        <span className="text-muted-foreground"> · 게스트</span>
                      )}
                    </TableCell>
                    <TableCell>{content.region ?? "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(content.likes)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatRelative(content.createdAt, now)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </CardContent>
      </Card>
    </>
  )
}
