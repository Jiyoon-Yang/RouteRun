"use client"

import { useState } from "react"
import { DownloadIcon } from "lucide-react"

import { SearchInput } from "@/commons/components/search-input"
import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/commons/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/commons/components/ui/table"
import { formatDateTime } from "@/commons/utils/format"
import { LOG_ACTION_LABEL } from "@/commons/constants/labels"
import { ADMINS, MOCK_NOW, logs } from "@/commons/mocks"
import type { LogAction } from "@/commons/types/admin"

import { DESTRUCTIVE_ACTIONS, LOG_ACTION_ICON } from "./utils/action-icon"

const PERIODS = [
  { label: "오늘", value: "1" },
  { label: "최근 7일", value: "7" },
  { label: "최근 30일", value: "30" },
]
const ACTIONS = [
  { label: "모든 작업", value: "all" },
  ...(Object.keys(LOG_ACTION_LABEL) as LogAction[]).map((action) => ({
    label: LOG_ACTION_LABEL[action],
    value: action,
  })),
]
const ADMIN_ITEMS = [
  { label: "모든 관리자", value: "all" },
  ...ADMINS.map((admin) => ({ label: admin, value: admin })),
]

export function AuditPage() {
  const [period, setPeriod] = useState("30")
  const [action, setAction] = useState("all")
  const [admin, setAdmin] = useState("all")
  const [query, setQuery] = useState("")

  const since = Date.parse(MOCK_NOW) - Number(period) * 24 * 60 * 60 * 1000
  const visible = logs.filter(
    (log) =>
      Date.parse(log.at) >= since &&
      (action === "all" || log.action === action) &&
      (admin === "all" || log.admin === admin) &&
      (log.target.includes(query) || log.reason?.includes(query))
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          items={PERIODS}
          value={period}
          onChange={setPeriod}
          className="w-32"
        />
        <FilterSelect
          items={ACTIONS}
          value={action}
          onChange={setAction}
          className="w-36"
        />
        <FilterSelect
          items={ADMIN_ITEMS}
          value={admin}
          onChange={setAdmin}
          className="w-56"
        />
        <SearchInput
          className="w-64"
          placeholder="대상·사유 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button variant="outline" className="ml-auto">
          <DownloadIcon data-icon="inline-start" />
          CSV
        </Button>
      </div>

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
            {visible.map((log) => {
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
                  <TableCell className="max-w-80 truncate">
                    {log.target}
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">
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
      <p className="text-sm text-muted-foreground">
        {visible.length}건 · 기록은 수정·삭제할 수 없습니다.
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
