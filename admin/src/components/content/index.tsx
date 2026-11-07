"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { EyeIcon, EyeOffIcon, MoreHorizontalIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"

import { RoutePreview } from "@/commons/components/route-preview"
import { SearchInput } from "@/commons/components/search-input"
import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import { Checkbox } from "@/commons/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/commons/components/ui/dropdown-menu"
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
import { Tabs, TabsList, TabsTrigger } from "@/commons/components/ui/tabs"
import { formatDate, formatDistance } from "@/commons/utils/format"
import { contents as initialContents, findUser } from "@/commons/mocks"
import type { ContentKind, Content } from "@/commons/types/admin"

import { HideDialog } from "./hide-dialog"

const REGIONS = [
  { label: "모든 지역", value: "all" },
  ...[...new Set(initialContents.map((content) => content.region))]
    .sort()
    .map((region) => ({ label: region, value: region })),
]

const VISIBILITY = [
  { label: "공개·숨김 전체", value: "all" },
  { label: "공개만", value: "visible" },
  { label: "숨김만", value: "hidden" },
]

export function ContentPage() {
  const [contents, setContents] = useState(initialContents)
  const [kind, setKind] = useState<ContentKind>("course")
  const [region, setRegion] = useState("all")
  const [visibility, setVisibility] = useState("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [hideTargets, setHideTargets] = useState<string[]>([])

  const visible = contents.filter(
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

  function setHidden(ids: string[], isHidden: boolean) {
    setContents((list) =>
      list.map((content) =>
        ids.includes(content.id) ? { ...content, isHidden } : content
      )
    )
    setSelected([])
    toast.success(`${ids.length}개 ${isHidden ? "숨김" : "숨김 해제"}`)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={kind}
          onValueChange={(value) => {
            setKind(value as ContentKind)
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
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          items={REGIONS}
          value={region}
          onValueChange={(value) => setRegion(value as string)}
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
          onValueChange={(value) => setVisibility(value as string)}
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
              onClick={() => setHidden(selected, false)}
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
                onUnhide={() => setHidden([content.id], false)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        {visible.length}개 · 실제 구현은 서버 페이지네이션(20개씩)
      </p>

      <HideDialog
        target={
          hideTargets.length === 1
            ? `'${contents.find((content) => content.id === hideTargets[0])?.title}'`
            : hideTargets.length > 1
              ? `${label} ${hideTargets.length}개`
              : null
        }
        onOpenChange={(open) => !open && setHideTargets([])}
        onConfirm={() => {
          setHidden(hideTargets, true)
          setHideTargets([])
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
  const author = findUser(content.authorId)

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
            {content.path ? (
              <RoutePreview path={content.path} className="size-full" />
            ) : content.imageUrls[0] ? (
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
        {author.nickname}
        {author.isAnonymous && (
          <span className="text-muted-foreground"> · 게스트</span>
        )}
        {author.suspendedUntil && (
          <Badge variant="destructive" className="ml-1">
            정지
          </Badge>
        )}
      </TableCell>
      <TableCell>{content.region}</TableCell>
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
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/users" />}>
                <UserIcon />
                작성자 보기
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
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
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
