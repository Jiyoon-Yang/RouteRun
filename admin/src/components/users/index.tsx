"use client"

import { useState } from "react"
import { toast } from "sonner"

import { SearchInput } from "@/commons/components/search-input"
import { Badge } from "@/commons/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/commons/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/commons/components/ui/item"
import { ScrollArea } from "@/commons/components/ui/scroll-area"
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
import {
  formatDate,
  formatNumber,
  formatRelative,
} from "@/commons/utils/format"
import { users as initialUsers } from "@/commons/mocks"
import type { User } from "@/commons/types/admin"

import { SuspendPanel } from "./suspend-panel"
import { ReportList, UserAvatar, WrittenList } from "./user-activity"

export function UsersPage() {
  const [users, setUsers] = useState(initialUsers)
  const [type, setType] = useState("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(initialUsers[0].id)
  const selected = users.find((user) => user.id === selectedId)!

  const visible = users.filter(
    (user) =>
      (type === "all" || user.isAnonymous === (type === "guest")) &&
      (user.nickname.includes(query) || user.email?.includes(query))
  )

  function update(id: string, patch: Partial<User>) {
    setUsers((list) =>
      list.map((user) => (user.id === id ? { ...user, ...patch } : user))
    )
    toast.success(patch.suspendedUntil ? "정지 처리됨" : "정지 해제됨")
  }

  return (
    <div className="grid h-[calc(100svh-6.5rem)] min-h-[32rem] grid-cols-[20rem_minmax(0,1fr)] gap-4">
      <Card className="min-h-0 gap-0 py-0">
        <div className="flex flex-col gap-2 border-b p-3">
          <SearchInput
            placeholder="닉네임·이메일 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[type]}
            onValueChange={(value) => value[0] && setType(value[0])}
          >
            <ToggleGroupItem value="all">전체</ToggleGroupItem>
            <ToggleGroupItem value="google">구글</ToggleGroupItem>
            <ToggleGroupItem value="guest">게스트</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-1 p-2">
            {visible.map((user) => (
              <Item
                key={user.id}
                size="sm"
                variant={user.id === selectedId ? "muted" : "default"}
                render={
                  <button
                    type="button"
                    onClick={() => setSelectedId(user.id)}
                  />
                }
                className="text-left"
              >
                <ItemMedia>
                  <UserAvatar user={user} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {user.nickname}
                    {user.suspendedUntil && (
                      <Badge variant="destructive">정지</Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>
                    {user.isAnonymous ? "게스트" : "구글"} ·{" "}
                    {formatRelative(user.lastSeenAt)} 접속
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <Card>
          <CardHeader className="flex items-center gap-4">
            <UserAvatar user={selected} className="size-14" />
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                {selected.nickname}
                <Badge variant={selected.isAnonymous ? "outline" : "secondary"}>
                  {selected.isAnonymous ? "게스트" : "구글"}
                </Badge>
                {selected.suspendedUntil && (
                  <Badge variant="destructive">정지</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selected.email ?? "이메일 없음"} ·{" "}
                {formatDate(selected.joinedAt)} 가입 · 최근 접속{" "}
                {formatRelative(selected.lastSeenAt)}
              </CardDescription>
            </div>
            <CardAction className="ml-auto flex gap-6 self-center">
              {[
                ["코스", selected.courseCount],
                ["트랙", selected.trackCount],
                ["좋아요", selected.likeCount],
                ["제보", selected.reportCount],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-xl font-semibold tabular-nums">
                    {formatNumber(value as number)}
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </CardAction>
          </CardHeader>
        </Card>

        <Tabs key={selected.id} defaultValue="written">
          <TabsList variant="line">
            <TabsTrigger value="written">작성글</TabsTrigger>
            <TabsTrigger value="reports">제보</TabsTrigger>
            <TabsTrigger value="suspend">정지 관리</TabsTrigger>
          </TabsList>
          <TabsContent value="written" className="pt-4">
            <WrittenList user={selected} />
          </TabsContent>
          <TabsContent value="reports" className="pt-4">
            <ReportList user={selected} />
          </TabsContent>
          <TabsContent value="suspend" className="max-w-lg pt-4">
            <SuspendPanel
              user={selected}
              onChange={(patch) => update(selected.id, patch)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
