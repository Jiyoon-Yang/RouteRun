"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { EyeIcon, EyeOffIcon, MoreHorizontalIcon } from "lucide-react"

import { SearchInput } from "@/commons/components/search-input"
import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import { Checkbox } from "@/commons/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/commons/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/commons/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/commons/components/ui/pagination"
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
import { Tabs, TabsList, TabsTrigger } from "@/commons/components/ui/tabs"
import { CONTENT_PAGE_SIZE, REGION_GROUPS } from "@/commons/constants/content"
import { formatDate, formatDistance } from "@/commons/utils/format"
import type {
  ContentFilters,
  ContentKind,
  Content,
} from "@/commons/types/admin"

import { HideDialog } from "./hide-dialog"
import { useContents } from "./hooks/use-contents"

const VISIBILITY = [
  { label: "공개·숨김 전체", value: "all" },
  { label: "공개만", value: "visible" },
  { label: "숨김만", value: "hidden" },
]

const REGIONS = [
  { label: "모든 지역", value: "all" },
  ...REGION_GROUPS.map(({ label }) => ({ label, value: label })),
]

export function ContentPage() {
  const [kind, setKind] = useState<ContentKind>("course")
  const [region, setRegion] = useState("all")
  const [visibility, setVisibility] =
    useState<ContentFilters["visibility"]>("all")
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [hideTargets, setHideTargets] = useState<string[]>([])
  const { contents, total, isLoading, setHidden } = useContents({
    kind,
    region,
    visibility,
    query,
    page,
  })

  // 조건을 바꾸면 첫 페이지로 가고 선택을 비운다. 화면에 안 보이는 글까지 일괄 처리되지 않게.
  const resetView = () => {
    setPage(1)
    setSelected([])
  }

  // 글자마다 서버를 부르지 않게 입력이 멈춘 뒤 검색한다.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = input.trim()
      if (next === query) return
      setQuery(next)
      setPage(1)
      setSelected([])
    }, 300)
    return () => clearTimeout(timer)
  }, [input, query])

  const list = contents ?? []
  const pageCount = Math.ceil(total / CONTENT_PAGE_SIZE)
  // 마지막 페이지 글을 모두 숨기거나 해제해 페이지가 사라지면, 남은 마지막 페이지로 옮긴다.
  const lastPage = Math.max(1, pageCount)
  if (contents && !isLoading && page > lastPage) setPage(lastPage)
  const allChecked =
    list.length > 0 && list.every((content) => selected.includes(content.id))
  const label = kind === "course" ? "코스" : "트랙"

  // shadcn 페이지 링크는 <a>라서 href가 있어야 키보드로 포커스·Enter가 된다. 주소는 바꾸지 않고 상태만 바꾼다.
  const pageLinkProps = (target: number, disabled = false) => ({
    href: "#",
    "aria-disabled": disabled || undefined,
    tabIndex: disabled ? -1 : undefined,
    className: disabled ? "pointer-events-none opacity-50" : undefined,
    onClick: (event: React.MouseEvent) => {
      event.preventDefault()
      if (disabled) return
      setPage(target)
      setSelected([])
    },
  })

  // 처리한 글만 선택에서 뺀다. 한 행만 해제해도 다른 체크가 풀리지 않게.
  const deselect = (ids: string[]) =>
    setSelected((current) => current.filter((id) => !ids.includes(id)))

  async function unhide(ids: string[]) {
    if (await setHidden(kind, ids, false)) deselect(ids)
  }

  if (!isLoading && !contents) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>코스·트랙을 불러오지 못했습니다</EmptyTitle>
          <EmptyDescription>
            서버 로그와 SUPABASE_SERVICE_ROLE_KEY 설정을 확인하세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={kind}
          onValueChange={(value) => {
            setKind(value as ContentKind)
            resetView()
          }}
        >
          <TabsList>
            <TabsTrigger value="course">코스</TabsTrigger>
            <TabsTrigger value="track">트랙</TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchInput
          className="w-64"
          placeholder={`${label} 제목 검색`}
          value={input}
          maxLength={100}
          onChange={(event) => setInput(event.target.value)}
        />
        <Select
          items={REGIONS}
          value={region}
          onValueChange={(value) => {
            setRegion(value as string)
            resetView()
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {REGIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          items={VISIBILITY}
          value={visibility}
          onValueChange={(value) => {
            setVisibility(value as ContentFilters["visibility"])
            resetView()
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {VISIBILITY.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {selected.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selected.length}개 선택
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => unhide(selected)}
            >
              <EyeIcon data-icon="inline-start" />
              숨김 해제
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setHideTargets(selected)}
            >
              <EyeOffIcon data-icon="inline-start" />
              숨김
            </Button>
          </div>
        )}
      </div>

      {contents && (
        <p className="text-sm text-muted-foreground">총 {total}개</p>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="전체 선택"
                  checked={allChecked}
                  onCheckedChange={(checked) =>
                    setSelected(
                      checked ? list.map((content) => content.id) : []
                    )
                  }
                />
              </TableHead>
              <TableHead>{label}</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>지역</TableHead>
              <TableHead className="text-right">거리</TableHead>
              <TableHead className="text-right">좋아요</TableHead>
              <TableHead className="text-right">등록일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && list.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>해당하는 글이 없습니다</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              list.map((content) => (
                <ContentRow
                  key={content.id}
                  content={content}
                  checked={selected.includes(content.id)}
                  onCheckedChange={(checked) =>
                    setSelected((ids) =>
                      checked
                        ? [...ids, content.id]
                        : ids.filter((id) => id !== content.id)
                    )
                  }
                  onHide={() => setHideTargets([content.id])}
                  onUnhide={() => unhide([content.id])}
                />
              ))}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <Pagination aria-label="페이지 이동">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="이전"
                aria-label="이전 페이지"
                {...pageLinkProps(page - 1, page === 1)}
              />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={index + 1 === page}
                  {...pageLinkProps(index + 1)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                text="다음"
                aria-label="다음 페이지"
                {...pageLinkProps(page + 1, page === pageCount)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <HideDialog
        target={
          hideTargets.length === 1
            ? `'${list.find((content) => content.id === hideTargets[0])?.title}'`
            : hideTargets.length > 1
              ? `${label} ${hideTargets.length}개`
              : null
        }
        onOpenChange={(open) => !open && setHideTargets([])}
        onConfirm={async (reason) => {
          const ids = hideTargets
          const ok = await setHidden(kind, ids, true, reason)
          // 실패하면 다이얼로그와 입력한 사유를 그대로 두고 다시 시도하게 한다.
          if (ok) {
            deselect(ids)
            setHideTargets([])
          }
          return ok
        }}
      />
    </>
  )
}

function ContentRow({
  content,
  checked,
  onCheckedChange,
  onHide,
  onUnhide,
}: {
  content: Content
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onHide: () => void
  onUnhide: () => void
}) {
  return (
    <TableRow data-state={checked ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          aria-label={`${content.title} 선택`}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md">
            {content.imageUrls[0] ? (
              <Image
                src={content.imageUrls[0]}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              // 사진 없는 글이 대부분이라 사용자 앱 카드처럼 로고로 채운다.
              <div className="flex size-full items-center justify-center bg-muted">
                <Image
                  src="/logo.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="dark:hidden"
                />
                {/* 로고 본체가 거의 검정이라 다크 모드 배경에 묻혀서 흰색 판을 쓴다. */}
                <Image
                  src="/logo-dark.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="hidden dark:block"
                />
              </div>
            )}
          </div>
          <div className="flex max-w-72 flex-col">
            <span className="truncate font-medium">{content.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              {content.description || "설명 없음"}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {content.author.nickname}
        {content.author.isAnonymous && (
          <span className="text-muted-foreground"> · 게스트</span>
        )}
      </TableCell>
      <TableCell>{content.region ?? "—"}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatDistance(content.distanceMeters)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{content.likes}</TableCell>
      <TableCell className="text-right text-muted-foreground tabular-nums">
        {formatDate(content.createdAt)}
      </TableCell>
      <TableCell>
        {content.isHidden ? (
          <Badge variant="destructive">숨김</Badge>
        ) : (
          <Badge variant="outline">공개</Badge>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="작업" />}
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {content.isHidden ? (
              <DropdownMenuItem onClick={onUnhide}>
                <EyeIcon />
                숨김 해제
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="destructive" onClick={onHide}>
                <EyeOffIcon />
                숨김
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
