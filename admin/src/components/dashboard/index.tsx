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
  CardFooter,
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
import { formatNumber, formatRelative } from "@/commons/utils/format"
import {
  contents,
  dailyStats,
  findUser,
  regionStats,
  reports,
  totals,
} from "@/commons/mocks"

import { SearchStatsCard } from "./search-stats"

const signupConfig = {
  signups: { label: "구글", color: "var(--chart-1)" },
  guests: { label: "게스트", color: "var(--chart-2)" },
} satisfies ChartConfig

const regionConfig = {
  courses: { label: "코스", color: "var(--chart-1)" },
  tracks: { label: "트랙", color: "var(--chart-3)" },
} satisfies ChartConfig

const openReports = reports.filter((report) => report.status === "open").length

const KPIS = [
  {
    label: "전체 유저",
    value: totals.users,
    delta: `이번 주 +${totals.newUsersThisWeek}`,
    note: `게스트 ${formatNumber(totals.guests)}명 포함`,
  },
  {
    label: "코스",
    value: totals.courses,
    delta: `이번 주 +${totals.newContentThisWeek - 6}`,
    note: "숨김 2건 제외",
  },
  {
    label: "트랙",
    value: totals.tracks,
    delta: "이번 주 +6",
    note: "숨김 1건 제외",
  },
  {
    label: "누적 좋아요",
    value: totals.likes,
    delta: "이번 주 +412",
    note: "코스·트랙 합산",
  },
]

export function DashboardPage() {
  const [range, setRange] = useState("30")
  const chartData = dailyStats.slice(-Number(range))
  const recent = [...contents]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {formatNumber(kpi.value)}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">{kpi.delta}</Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">
              {kpi.note}
            </CardFooter>
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
                <YAxis tickLine={false} axisLine={false} width={28} />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지역별 등록</CardTitle>
            <CardDescription>상위 7개 구</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={regionConfig}
              className="aspect-auto h-64 w-full"
            >
              <BarChart
                data={regionStats}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="region"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <XAxis type="number" hide />
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
          </CardContent>
        </Card>
      </div>

      <SearchStatsCard />

      <Card>
        <CardHeader>
          <CardTitle>최근 등록</CardTitle>
          <CardDescription>
            미처리 제보 {openReports}건은 제보 처리함에서 확인
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
              {recent.map((content) => {
                const author = findUser(content.authorId)
                return (
                  <TableRow key={content.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {content.kind === "course" ? "코스" : "트랙"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate font-medium">
                      {content.title}
                    </TableCell>
                    <TableCell>
                      {author.nickname}
                      {author.isAnonymous && (
                        <span className="text-muted-foreground"> · 게스트</span>
                      )}
                    </TableCell>
                    <TableCell>{content.region}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {content.likes}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatRelative(content.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
