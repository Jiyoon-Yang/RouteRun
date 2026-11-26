"use client"

import { useEffect, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { SearchInput } from "@/commons/components/search-input"
import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/commons/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/commons/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/commons/components/ui/item"
import { ScrollArea } from "@/commons/components/ui/scroll-area"
import { Skeleton } from "@/commons/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/commons/components/ui/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/commons/components/ui/toggle-group"
import { USER_PAGE_SIZE } from "@/commons/constants/content"
import {
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/commons/utils/format"
import type { User, UserFilters } from "@/commons/types/admin"

import { useUserDetail, useUsers } from "./hooks/use-users"
import { ReportList, UserAvatar, WrittenList } from "./user-activity"

export function UsersPage() {
  const [type, setType] = useState<UserFilters["type"]>("all")
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  // 페이지·필터를 바꿔도 보던 유저가 그대로 보이게 목록 행 전체를 들고 있는다.
  const [selected, setSelected] = useState<User | null>(null)
  const { users, total, isLoading } = useUsers({ type, query, page })
  const { detail, isLoading: isDetailLoading } = useUserDetail(
    selected?.id ?? null
  )

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

  // 20rem 열이라 번호를 전부 나열하는 PageNav는 유저가 늘면 넘친다. 이전·다음만 둔다.
  const pageCount = Math.max(1, Math.ceil(total / USER_PAGE_SIZE))
  if (users && !isLoading && page > pageCount) setPage(pageCount)

  return (
    <div className="grid h-[calc(100svh-6.5rem)] min-h-[32rem] grid-cols-[20rem_minmax(0,1fr)] gap-4">
      <Card className="min-h-0 gap-0 py-0">
        <div className="flex flex-col gap-2 border-b p-3">
          <SearchInput
            placeholder="닉네임 검색"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[type]}
            onValueChange={(value) => {
              if (!value[0]) return
              setType(value[0] as UserFilters["type"])
              setPage(1)
            }}
          >
            <ToggleGroupItem value="all">전체</ToggleGroupItem>
            <ToggleGroupItem value="google">구글</ToggleGroupItem>
            <ToggleGroupItem value="guest">게스트</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-1 p-2">
            {isLoading &&
              Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            {!isLoading && !users && (
              <p className="p-2 text-sm text-muted-foreground">
                유저를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            )}
            {!isLoading && users?.length === 0 && (
              <p className="p-2 text-sm text-muted-foreground">
                해당하는 유저가 없습니다.
              </p>
            )}
            {!isLoading &&
              users?.map((user) => (
                <Item
                  key={user.id}
                  size="sm"
                  variant={user.id === selected?.id ? "muted" : "default"}
                  render={
                    <button type="button" onClick={() => setSelected(user)} />
                  }
                  className="text-left"
                >
                  <ItemMedia>
                    <UserAvatar user={user} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{user.nickname}</ItemTitle>
                    <ItemDescription>
                      {user.isAnonymous ? "게스트" : "구글"} ·{" "}
                      {formatDate(user.joinedAt)} 가입
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-between border-t p-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="이전 페이지"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="tabular-nums">
            {page} / {pageCount} · {formatNumber(total)}명
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="다음 페이지"
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </Card>

      {!selected ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>유저를 선택하세요</EmptyTitle>
            <EmptyDescription>
              왼쪽 목록에서 고르면 프로필과 활동이 보입니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          {/* 작성글이 길어도 프로필 카드가 눌려 잘리지 않게 */}
          <Card className="shrink-0">
            <CardHeader className="flex items-center gap-4">
              <UserAvatar user={selected} className="size-14" />
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {selected.nickname}
                  <Badge
                    variant={selected.isAnonymous ? "outline" : "secondary"}
                  >
                    {selected.isAnonymous ? "게스트" : "구글"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {isDetailLoading ? (
                    <Skeleton className="h-4 w-64" />
                  ) : (
                    <>
                      {detail?.email ?? "이메일 없음"} ·{" "}
                      {formatDate(selected.joinedAt)} 가입
                      {detail?.lastSignInAt &&
                        ` · 최근 로그인 ${formatDateTime(detail.lastSignInAt)}`}
                    </>
                  )}
                </CardDescription>
              </div>
              <CardAction className="ml-auto flex gap-6 self-center">
                {(
                  [
                    ["코스", detail?.courseCount],
                    ["트랙", detail?.trackCount],
                    ["좋아요", detail?.likeCount],
                    ["제보", detail?.reportCount],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex flex-col items-center">
                    <span className="text-xl font-semibold tabular-nums">
                      {value === undefined ? "–" : formatNumber(value)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </CardAction>
            </CardHeader>
          </Card>

          {isDetailLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !detail ? (
            <p className="text-sm text-muted-foreground">
              활동을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          ) : (
            <Tabs key={selected.id} defaultValue="written">
              <TabsList variant="line">
                <TabsTrigger value="written">작성글</TabsTrigger>
                <TabsTrigger value="reports">제보</TabsTrigger>
              </TabsList>
              <TabsContent value="written" className="pt-4">
                <WrittenList written={detail.written} />
              </TabsContent>
              <TabsContent value="reports" className="pt-4">
                <ReportList reports={detail.reports} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  )
}
