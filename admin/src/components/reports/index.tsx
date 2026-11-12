"use client"

import { useEffect, useState } from "react"
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/commons/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/commons/components/ui/field"
import {
  Item,
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
import { Skeleton } from "@/commons/components/ui/skeleton"
import { Textarea } from "@/commons/components/ui/textarea"
import {
  formatDateTime,
  formatRelative,
  formatReportId,
} from "@/commons/utils/format"
import { REPORT_STATUS_LABEL } from "@/commons/constants/labels"
import type { Report, Reporter, ReportStatus } from "@/commons/types/admin"
import { useReports } from "@/components/reports/hooks/use-reports"
import { cn } from "@/lib/utils"

const FILTERS = [
  { label: "미처리 (접수·처리중)", value: "pending" },
  { label: "접수", value: "open" },
  { label: "처리중", value: "in_progress" },
  { label: "완료", value: "resolved" },
  { label: "전체", value: "all" },
]

type ReportPatch = { status?: ReportStatus; adminNote: string }

export function ReportsPage() {
  const { data, isLoading, update } = useReports()
  const [filter, setFilter] = useState("pending")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const reports = data?.reports ?? []
  const visible = reports.filter(
    (report) =>
      (filter === "all" ||
        (filter === "pending"
          ? report.status !== "resolved"
          : report.status === filter)) &&
      report.content.includes(query)
  )
  // 처음에는 목록 맨 위 제보를 연다.
  const selected =
    reports.find((report) => report.id === selectedId) ?? visible[0]
  const now = new Date().toISOString()

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
      const index = visible.findIndex((report) => report.id === selected?.id)
      const next = visible[index + (event.key === "ArrowDown" ? 1 : -1)]
      if (next) setSelectedId(next.id)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [visible, selected])

  if (!isLoading && !data) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>제보를 불러오지 못했습니다</EmptyTitle>
          <EmptyDescription>
            서버 로그와 SUPABASE_SERVICE_ROLE_KEY 설정을 확인하세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
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
              {isLoading &&
                Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="border-b px-4 py-3">
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              {!isLoading && visible.length === 0 && (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>해당하는 제보가 없습니다</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
              {visible.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className={cn(
                    "flex flex-col gap-1 border-b px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                    report.id === selected?.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {report.status === "open" && (
                      <span
                        className="size-2 rounded-full bg-primary"
                        aria-label="새 제보"
                      />
                    )}
                    <span className="font-medium">
                      {data?.reporters[report.userId].nickname}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatRelative(report.createdAt, now)}
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
              ))}
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
        {selected && data ? (
          <ReportDetail
            key={selected.id}
            report={selected}
            reporter={data.reporters[selected.userId]}
            reportCount={
              reports.filter((report) => report.userId === selected.userId)
                .length
            }
            onUpdate={(id, patch) => {
              // 자동으로 열린 제보도 처리 후 필터에서 빠질 때 다음 제보로 넘어가지 않게 고정한다.
              setSelectedId(id)
              return update(id, patch)
            }}
          />
        ) : null}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function ReportDetail({
  report,
  reporter,
  reportCount,
  onUpdate,
}: {
  report: Report
  reporter: Reporter
  reportCount: number
  onUpdate: (id: string, patch: ReportPatch) => Promise<boolean>
}) {
  const [note, setNote] = useState(report.adminNote)
  const [isSaving, setIsSaving] = useState(false)

  // 저장 중에는 버튼을 막아 같은 조치가 두 번 기록되지 않게 한다.
  async function save(status?: ReportStatus) {
    setIsSaving(true)
    const ok = await onUpdate(report.id, { status, adminNote: note })
    setIsSaving(false)
    return ok
  }

  async function setStatus(status: ReportStatus) {
    if (await save(status)) {
      toast.success(
        `제보 ${formatReportId(report.id)} → ${REPORT_STATUS_LABEL[status]}`
      )
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <ReportTypeBadge type={report.type} />
        <ReportStatusBadge status={report.status} />
        <span className="text-sm text-muted-foreground">
          제보 {formatReportId(report.id)}
          {report.status === "resolved" &&
            report.handledAt &&
            ` · ${formatDateTime(report.handledAt)} 완료`}
        </span>
        <ButtonGroup className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={isSaving || report.status === "in_progress"}
            onClick={() => setStatus("in_progress")}
          >
            처리중으로
          </Button>
          <Button
            size="sm"
            disabled={isSaving || report.status === "resolved"}
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
                {reporter.avatarUrl && (
                  <AvatarImage src={reporter.avatarUrl} alt="" />
                )}
                <AvatarFallback>{reporter.nickname.slice(0, 1)}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {reporter.nickname}
                <Badge variant="secondary">
                  {reporter.isAnonymous ? "게스트" : "구글"}
                </Badge>
              </ItemTitle>
              <ItemDescription>
                {formatDateTime(report.createdAt)} · 코스 {reporter.courseCount}{" "}
                · 트랙 {reporter.trackCount} · 제보 {reportCount}
              </ItemDescription>
            </ItemContent>
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
                disabled={isSaving}
                onClick={async () => {
                  if (await save()) toast("메모 저장됨")
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
