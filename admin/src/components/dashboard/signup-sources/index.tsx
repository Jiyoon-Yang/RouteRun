"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/commons/components/ui/card"
import { Skeleton } from "@/commons/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/commons/components/ui/table"
import { SOURCE_LABEL } from "@/commons/constants/labels"
import { formatNumber } from "@/commons/utils/format"

import { useSignupSources } from "./hooks/use-signup-sources"

export function SignupSourcesCard() {
  const { sources, isLoading } = useSignupSources()

  return (
    <Card>
      <CardHeader>
        <CardTitle>가입 경로</CardTitle>
        <CardDescription>
          최근 30일 · 처음 들어온 곳 상위 7개 (GA4)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !sources ? (
          <p className="text-sm text-muted-foreground">
            가입 경로를 불러오지 못했습니다. 환경 변수와 권한 설정은 admin
            README의 &ldquo;검색 유입 카드&rdquo;를 참고하세요.
          </p>
        ) : sources.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>경로</TableHead>
                <TableHead className="text-right">구글</TableHead>
                <TableHead className="text-right">게스트</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((row) => (
                <TableRow key={row.source}>
                  <TableCell className="max-w-40 truncate">
                    {SOURCE_LABEL[row.source] ?? row.source}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.google)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.guest)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-6 text-sm text-muted-foreground">
            아직 집계된 가입이 없습니다. 사용자 앱 배포 이후 가입부터 쌓입니다.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
