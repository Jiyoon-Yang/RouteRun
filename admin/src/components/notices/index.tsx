"use client"

import { useState } from "react"
import {
  MoreHorizontalIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/commons/components/ui/alert-dialog"
import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/commons/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/commons/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/commons/components/ui/empty"
import { Skeleton } from "@/commons/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/commons/components/ui/table"
import { formatDate, formatDateTime } from "@/commons/utils/format"
import type { Notice, NoticeDraft, NoticeStatus } from "@/commons/types/admin"

import { useNotices } from "./hooks/use-notices"
import { EMPTY_NOTICE, NoticeFields, toDraft } from "./notice-fields"

export function NoticesPage() {
  const { notices: data, isLoading, save: saveNotice, remove } = useNotices()
  // null = 닫힘, "new" = 새 공지, 그 외 = 수정 중인 공지 id
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<NoticeDraft>(EMPTY_NOTICE)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const notices = data ?? []
  const sorted = [...notices].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.updatedAt.localeCompare(a.updatedAt)
  )

  function open(notice?: Notice) {
    setDraft(toDraft(notice))
    setEditing(notice?.id ?? "new")
  }

  async function save(status: NoticeStatus) {
    setIsSaving(true)
    const saved = await saveNotice(
      editing === "new" ? null : editing,
      draft,
      status
    )
    setIsSaving(false)
    if (!saved) return

    setEditing(null)
    toast.success(
      status === "published"
        ? "게시했어요. 사용자 앱 /notice에 바로 보입니다."
        : "초안 저장됨"
    )
  }

  async function confirmDelete() {
    const id = deleteId!
    setDeleteId(null)
    if (await remove(id)) toast("공지 삭제됨")
  }

  if (!isLoading && !data) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>공지를 불러오지 못했습니다</EmptyTitle>
          <EmptyDescription>
            서버 로그와 SUPABASE_SERVICE_ROLE_KEY 설정을 확인하세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          게시{" "}
          {notices.filter((notice) => notice.status === "published").length}건 ·
          초안 {notices.filter((notice) => notice.status === "draft").length}건
        </p>
        <Button onClick={() => open()}>
          <PlusIcon data-icon="inline-start" />새 공지
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead className="w-24">상태</TableHead>
              <TableHead className="w-32 text-right">게시일</TableHead>
              <TableHead className="w-36 text-right">마지막 수정</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  아직 공지가 없습니다
                </TableCell>
              </TableRow>
            )}
            {sorted.map((notice) => (
              <TableRow
                key={notice.id}
                className="cursor-pointer"
                onClick={() => open(notice)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {notice.pinned && (
                      <PinIcon
                        className="size-4 text-muted-foreground"
                        aria-label="상단 고정"
                      />
                    )}
                    {notice.title}
                  </div>
                </TableCell>
                <TableCell>
                  {notice.status === "published" ? (
                    <Badge variant="secondary">게시</Badge>
                  ) : (
                    <Badge variant="outline">초안</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {notice.publishedAt ? formatDate(notice.publishedAt) : "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatDateTime(notice.updatedAt)}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="작업"
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => open(notice)}>
                          <PencilIcon />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteId(notice.id)}
                        >
                          <TrashIcon />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(isOpen) => !isOpen && setEditing(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "새 공지" : "공지 수정"}
            </DialogTitle>
            <DialogDescription>
              게시하면 사용자 앱 공지사항 페이지에 바로 반영됩니다.
            </DialogDescription>
          </DialogHeader>
          <NoticeFields value={draft} onChange={setDraft} />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isSaving || !draft.title.trim()}
              onClick={() => save("draft")}
            >
              초안 저장
            </Button>
            <Button
              disabled={isSaving || !draft.title.trim() || !draft.body.trim()}
              onClick={() => save("published")}
            >
              게시
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(isOpen) => !isOpen && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {notices.find((notice) => notice.id === deleteId)?.title} —
              삭제하면 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
