"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import type { SearchStats } from "@/commons/types/admin"
import { formatNumber } from "@/commons/utils/format"

import { useSearchStats } from "./hooks/use-search-stats"

const metricConfig = {
  impressions: { label: "노출", color: "var(--chart-1)" },
  clicks: { label: "클릭", color: "var(--chart-2)" },
} satisfies ChartConfig

type Metric = keyof typeof metricConfig

const SOURCE_LABEL: Record<string, string> = {
  google: "구글",
  naver: "네이버",
  daum: "다음",
  bing: "빙",
}

const CONSOLES = [
  { label: "Search Console", href: "https://search.google.com/search-console" },
  {
    label: "서치어드바이저",
    href: "https://searchadvisor.naver.com/console/board",
  },
]

export function SearchStatsCard() {
  const { stats, isLoading } = useSearchStats()

  return (
    <Card>
      <CardHeader>
        <CardTitle>검색 유입</CardTitle>
        <CardDescription>
          최근 28일 · 구글 수치는 2~3일 늦게 반영
        </CardDescription>
        <CardAction className="flex gap-2">
          {CONSOLES.map((item) => (
            <Button
              key={item.href}
              variant="outline"
              size="sm"
              render={<a href={item.href} target="_blank" rel="noreferrer" />}
              nativeButton={false}
            >
              {item.label}
            </Button>
          ))}
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : stats ? (
          <SearchStatsBody stats={stats} />
        ) : (
          <p className="text-sm text-muted-foreground">
            검색 데이터를 불러오지 못했습니다. 환경 변수와 권한 설정은 admin
            README의 &ldquo;검색 유입 카드&rdquo;를 참고하세요.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SearchStatsBody({ stats }: { stats: SearchStats }) {
  const [metric, setMetric] = useState<Metric>("impressions")
  const { totals } = stats
  const tiles = [
    { label: "클릭", value: formatNumber(totals.clicks) },
    { label: "노출", value: formatNumber(totals.impressions) },
    {
      label: "클릭률",
      value: totals.impressions ? `${(totals.ctr * 100).toFixed(1)}%` : "-",
    },
    {
      label: "평균 순위",
      value: totals.impressions ? totals.position.toFixed(1) : "-",
    },
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <dl className="grid grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <div key={tile.label}>
              <dt className="text-sm text-muted-foreground">{tile.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[metric]}
          onValueChange={(value) => value[0] && setMetric(value[0] as Metric)}
        >
          <ToggleGroupItem value="impressions">노출</ToggleGroupItem>
          <ToggleGroupItem value="clicks">클릭</ToggleGroupItem>
        </ToggleGroup>
        {stats.daily.length > 0 ? (
          <ChartContainer
            config={metricConfig}
            className="aspect-auto h-56 w-full"
          >
            <AreaChart data={stats.daily} margin={{ left: 0, right: 8 }}>
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
                width={32}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey={metric}
                type="monotone"
                fill={`var(--color-${metric})`}
                fillOpacity={0.25}
                stroke={`var(--color-${metric})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <NoData>아직 구글 검색 데이터가 없습니다</NoData>
        )}
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-medium">
            검색엔진별 방문{" "}
            <span className="text-muted-foreground">· GA4 세션</span>
          </h3>
          {stats.organicSessions.length > 0 ? (
            <ul className="divide-y text-sm">
              {stats.organicSessions.map((row) => (
                <li key={row.source} className="flex justify-between py-1.5">
                  <span>{SOURCE_LABEL[row.source] ?? row.source}</span>
                  <span className="tabular-nums">
                    {formatNumber(row.sessions)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <NoData>아직 검색 유입 방문이 없습니다</NoData>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium">
            인기 검색어 <span className="text-muted-foreground">· 구글</span>
          </h3>
          {stats.queries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>검색어</TableHead>
                  <TableHead className="text-right">클릭</TableHead>
                  <TableHead className="text-right">노출</TableHead>
                  <TableHead className="text-right">순위</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.queries.map((row) => (
                  <TableRow key={row.query}>
                    <TableCell className="max-w-40 truncate">
                      {row.query}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.clicks)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.impressions)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.position.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <NoData>아직 검색어 데이터가 없습니다</NoData>
          )}
        </section>
      </div>
    </div>
  )
}

function NoData({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-sm text-muted-foreground">{children}</p>
}
