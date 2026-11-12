"use client"

import { useState } from "react"
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
import { formatDate, formatDistance } from "@/commons/utils/format"
import type { ContentKind, Content } from "@/commons/types/admin"

import { HideDialog } from "./hide-dialog"
import { useContents } from "./hooks/use-contents"

const VISIBILITY = [
  { label: "공개·숨김 전체", value: "all" },
  { label: "공개만", value: "visible" },
  { label: "숨김만", value: "hidden" },
]

export function ContentPage() {
  const { contents, isLoading, setHidden } = useContents()
  const [kind, setKind] = useState<ContentKind>("course")
  const [region, setRegion] = useState("all")
  const [visibility, setVisibility] = useState("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [hideTargets, setHideTargets] = useState<string[]>([])

  const list = contents ?? []
  const regions = [
    { label: "모든 지역", value: "all" },
    ...[
      ...new Set(
        list.flatMap((content) =>
          content.kind === kind && content.region ? [content.region] : []
        )
      ),
    ]
      .sort()
      .map((region) => ({ label: region, value: region })),
  ]
  const visible = list.filter(
    (content) =>
      content.kind === kind &&
      (region === "all" || content.region === region) &&
      (visibility === "all" ||
        content.isHidden === (visibility === "hidden")) &&
      content.title.includes(query)
  )
  const allChecked =
    visible.length > 0 &&
    visible.every((content) => selected.includes(content.id))
  const label = kind === "course" ? "코스" : "트랙"

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
            setRegion("all")
            setSelected([])
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
          value={query}
          onChange={(event) => {
            // 필터·검색을 바꾸면 선택을 비운다. 화면에 안 보이는 글까지 일괄 처리되지 않게.
            setQuery(event.target.value)
            setSelected([])
          }}
        />
        <Select
          items={regions}
          value={region}
          onValueChange={(value) => {
            setRegion(value as string)
            setSelected([])
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {regions.map((item) => (
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
            setVisibility(value as string)
            setSelected([])
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
                      checked ? visible.map((content) => content.id) : []
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
            {!isLoading && visible.length === 0 && (
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
            {visible.map((content) => (
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
      <p className="text-sm text-muted-foreground">
        {visible.length}개
      </p>

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
              <div className="size-full bg-muted" />
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
