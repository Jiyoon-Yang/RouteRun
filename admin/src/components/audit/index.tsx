"use client"

import { useEffect, useState } from "react"

import { PageNav } from "@/commons/components/page-nav"
import { SearchInput } from "@/commons/components/search-input"
import { Badge } from "@/commons/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/commons/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/commons/components/ui/select"
import { Skeleton } from "@/commons/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/commons/components/ui/table"
import { AUDIT_PAGE_SIZE } from "@/commons/constants/content"
import { LOG_ACTION_LABEL } from "@/commons/constants/labels"
import type { AuditFilters, LogAction } from "@/commons/types/admin"
import { formatDateTime, formatNumber } from "@/commons/utils/format"

import { useAuditLogs } from "./hooks/use-audit-logs"
import { DESTRUCTIVE_ACTIONS, LOG_ACTION_ICON } from "./utils/action-icon"

const PERIODS = [
  { label: "최근 24시간", value: "1" },
  { label: "최근 7일", value: "7" },
  { label: "최근 30일", value: "30" },
  { label: "전체 기간", value: "all" },
]
const ACTIONS = [
  { label: "모든 작업", value: "all" },
  ...(Object.keys(LOG_ACTION_LABEL) as LogAction[]).map((action) => ({
    label: LOG_ACTION_LABEL[action],
    value: action,
  })),
]

export function AuditPage() {
  const [period, setPeriod] = useState<AuditFilters["period"]>("30")
  const [action, setAction] = useState<AuditFilters["action"]>("all")
  const [adminId, setAdminId] = useState("all")
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const { list, admins, isLoading } = useAuditLogs({
    period,
    action,
    adminId,
    query,
    page,
  })

  // 글자마다 서버를 부르지 않게 입력이 멈춘 뒤 검색한다.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = input.trim()
      if (next === query) return
      setQuery(next)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [input, query])

  // 조건을 바꾸면 첫 페이지로 간다.
  const filterChange =
    <T,>(set: (value: T) => void) =>
    (value: string) => {
      set(value as T)
      setPage(1)
    }

  const total = list?.total ?? 0
  const pageCount = Math.ceil(total / AUDIT_PAGE_SIZE)
  const adminItems = [
    { label: "모든 관리자", value: "all" },
    ...admins.map((admin) => ({ label: admin.email, value: admin.id })),
  ]

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          items={PERIODS}
          value={period}
          onChange={filterChange(setPeriod)}
          className="w-32"
        />
        <FilterSelect
          items={ACTIONS}
          value={action}
          onChange={filterChange(setAction)}
          className="w-36"
        />
        <FilterSelect
          items={adminItems}
          value={adminId}
          onChange={filterChange(setAdminId)}
          className="w-56"
        />
        <SearchInput
          className="w-64"
          placeholder="대상·사유 검색"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </div>

      {!isLoading && !list ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>작업 기록을 불러오지 못했습니다</EmptyTitle>
            <EmptyDescription>잠시 후 다시 시도해 주세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">시각</TableHead>
                <TableHead className="w-36">작업</TableHead>
                <TableHead>대상</TableHead>
                <TableHead>사유</TableHead>
                <TableHead className="w-56">관리자</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && list?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    해당하는 기록이 없습니다
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                list?.items.map((log) => {
                  const Icon = LOG_ACTION_ICON[log.action]
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDateTime(log.at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            DESTRUCTIVE_ACTIONS.includes(log.action)
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          <Icon data-icon="inline-start" />
                          {LOG_ACTION_LABEL[log.action]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-80 truncate" title={log.target}>
                        {log.target}
                      </TableCell>
                      <TableCell
                        className="max-w-64 truncate text-muted-foreground"
                        title={log.reason ?? undefined}
                      >
                        {log.reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.admin}
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      )}

      <PageNav page={page} pageCount={pageCount} onPageChange={setPage} />
      <p className="text-sm text-muted-foreground">
        {formatNumber(total)}건 · 기록은 수정·삭제할 수 없습니다.
      </p>
    </>
  )
}

function FilterSelect({
  items,
  value,
  onChange,
  className,
}: {
  items: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next as string)}
    >
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
