"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { SearchInput } from "@/commons/components/search-input"
import {
  ReportStatusBadge,
  ReportTypeBadge,
} from "@/commons/components/status-badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/commons/components/ui/avatar"
import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import { ButtonGroup } from "@/commons/components/ui/button-group"
import { Field, FieldGroup, FieldLabel } from "@/commons/components/ui/field"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/commons/components/ui/item"
import { Kbd } from "@/commons/components/ui/kbd"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/commons/components/ui/resizable"
import { ScrollArea } from "@/commons/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/commons/components/ui/select"
import { Separator } from "@/commons/components/ui/separator"
import { Textarea } from "@/commons/components/ui/textarea"
import { formatDateTime, formatRelative } from "@/commons/utils/format"
import { REPORT_STATUS_LABEL } from "@/commons/constants/labels"
import { findUser, reports as initialReports } from "@/commons/mocks"
import type { ReportStatus } from "@/commons/types/admin"
import { cn } from "@/lib/utils"

const FILTERS = [
  { label: "미처리 (접수·처리중)", value: "pending" },
  { label: "접수", value: "open" },
  { label: "처리중", value: "in_progress" },
  { label: "완료", value: "resolved" },
  { label: "전체", value: "all" },
]

export function ReportsPage() {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState("pending")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(initialReports[0].id)

  const visible = reports.filter(
    (report) =>
      (filter === "all" ||
        (filter === "pending"
          ? report.status !== "resolved"
          : report.status === filter)) &&
      report.content.includes(query)
  )
  const selected = reports.find((report) => report.id === selectedId)

  // ↑↓로 목록 이동. 입력 중일 때는 무시.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea")
      )
        return
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
      event.preventDefault()
      const index = visible.findIndex((report) => report.id === selectedId)
      const next = visible[index + (event.key === "ArrowDown" ? 1 : -1)]
      if (next) setSelectedId(next.id)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [visible, selectedId])

  function update(
    id: string,
    patch: { status?: ReportStatus; adminNote?: string }
  ) {
    setReports((list) =>
      list.map((report) =>
        report.id === id ? { ...report, ...patch } : report
      )
    )
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-[calc(100svh-6.5rem)] min-h-[32rem] rounded-lg border"
    >
      <ResizablePanel defaultSize="38%" minSize="28%">
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-2 border-b p-3">
            <div className="flex items-center gap-2">
              <Select
                items={FILTERS}
                value={filter}
                onValueChange={(value) => setFilter(value as string)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {FILTERS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span className="ml-auto text-sm text-muted-foreground">
                {visible.length}건
              </span>
            </div>
            <SearchInput
              placeholder="내용 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col">
              {visible.map((report) => {
                const user = findUser(report.userId)
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedId(report.id)}
                    className={cn(
                      "flex flex-col gap-1 border-b px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                      report.id === selectedId && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {report.status === "open" && (
                        <span
                          className="size-2 rounded-full bg-primary"
                          aria-label="새 제보"
                        />
                      )}
                      <span className="font-medium">{user.nickname}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatRelative(report.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ReportTypeBadge type={report.type} />
                      {report.status !== "open" && (
                        <ReportStatusBadge status={report.status} />
                      )}
                    </div>
                    <p className="line-clamp-2 text-muted-foreground">
                      {report.content}
                    </p>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
          <div className="flex items-center gap-1 border-t px-3 py-2 text-xs text-muted-foreground">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            목록 이동
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="62%" minSize="40%">
        {selected ? (
          <ReportDetail
            key={selected.id}
            reportId={selected.id}
            reports={reports}
            onUpdate={update}
          />
        ) : null}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function ReportDetail({
  reportId,
  reports,
  onUpdate,
}: {
  reportId: string
  reports: typeof initialReports
  onUpdate: (
    id: string,
    patch: { status?: ReportStatus; adminNote?: string }
  ) => void
}) {
  const report = reports.find((item) => item.id === reportId)!
  const user = findUser(report.userId)
  const [note, setNote] = useState(report.adminNote)

  function setStatus(status: ReportStatus) {
    onUpdate(report.id, { status, adminNote: note })
    toast.success(
      `제보 #${report.id.slice(2)} → ${REPORT_STATUS_LABEL[status]}`
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <ReportTypeBadge type={report.type} />
        <ReportStatusBadge status={report.status} />
        <span className="text-sm text-muted-foreground">
          제보 #{report.id.slice(2)}
        </span>
        <ButtonGroup className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={report.status === "in_progress"}
            onClick={() => setStatus("in_progress")}
          >
            처리중으로
          </Button>
          <Button
            size="sm"
            disabled={report.status === "resolved"}
            onClick={() => setStatus("resolved")}
          >
            완료
          </Button>
        </ButtonGroup>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 p-6">
          <Item variant="outline">
            <ItemMedia>
              <Avatar>
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback>{user.nickname.slice(0, 1)}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {user.nickname}
                <Badge variant="secondary">
                  {user.isAnonymous ? "게스트" : "구글"}
                </Badge>
              </ItemTitle>
              <ItemDescription>
                {formatDateTime(report.createdAt)} · 코스 {user.courseCount} ·
                트랙 {user.trackCount} · 제보 {user.reportCount}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/users" />}
                nativeButton={false}
              >
                프로필
              </Button>
            </ItemActions>
          </Item>
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {report.content}
          </p>
          <Separator />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="note">내부 메모</FieldLabel>
              <Textarea
                id="note"
                rows={5}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="재현 여부, 조치 내용 등. 사용자에게는 보이지 않습니다."
              />
            </Field>
            <Field orientation="horizontal">
              <Button
                variant="outline"
                onClick={() => {
                  onUpdate(report.id, { adminNote: note })
                  toast("메모 저장됨")
                }}
              >
                메모 저장
              </Button>
            </Field>
          </FieldGroup>
        </div>
      </ScrollArea>
    </div>
  )
}
