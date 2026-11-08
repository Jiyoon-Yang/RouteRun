"use client"

import { useState } from "react"
import Image from "next/image"
import { TrashIcon } from "lucide-react"
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
import { Button } from "@/commons/components/ui/button"
import { Checkbox } from "@/commons/components/ui/checkbox"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/commons/components/ui/toggle-group"
import { formatRelative } from "@/commons/utils/format"
import { findContent, images as initialImages } from "@/commons/mocks"
import { cn } from "@/lib/utils"

export function ImagesPage() {
  const [images, setImages] = useState(initialImages)
  const [kind, setKind] = useState("all")
  const [selected, setSelected] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)

  const visible = images.filter(
    (image) => kind === "all" || findContent(image.contentId).kind === kind
  )

  function toggle(id: string) {
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          variant="outline"
          value={[kind]}
          onValueChange={(value) => value[0] && setKind(value[0])}
        >
          <ToggleGroupItem value="all">전체 {images.length}</ToggleGroupItem>
          <ToggleGroupItem value="course">코스</ToggleGroupItem>
          <ToggleGroupItem value="track">트랙</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-sm text-muted-foreground">
          최근 업로드 순 · 사진을 눌러 선택
        </p>
        {selected.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              선택 해제
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirming(true)}
            >
              <TrashIcon data-icon="inline-start" />
              {selected.length}장 삭제
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {visible.map((image) => {
          const content = findContent(image.contentId)
          const checked = selected.includes(image.id)
          return (
            <div
              key={image.id}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg ring-offset-2 ring-offset-background",
                checked && "ring-2 ring-destructive"
              )}
            >
              <button
                type="button"
                className="absolute inset-0"
                aria-label={`${content.title} 사진 선택`}
                aria-pressed={checked}
                onClick={() => toggle(image.id)}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 16vw, 25vw"
                  className="object-cover"
                />
              </button>
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(image.id)}
                aria-label={`${content.title} 사진 선택`}
                className={cn(
                  "absolute top-2 left-2 bg-background opacity-0 transition-opacity group-hover:opacity-100",
                  checked && "opacity-100"
                )}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col bg-linear-to-t from-black/70 to-transparent p-2 pt-6 text-xs text-white">
                <span className="truncate font-medium">{content.title}</span>
                <span className="opacity-80">
                  {formatRelative(image.uploadedAt)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              사진 {selected.length}장을 삭제할까요?
            </AlertDialogTitle>
            <AlertDialogDescription>
              스토리지에서 지우고 해당 글의 사진 목록에서도 빠집니다. 되돌릴 수
              없어요. 글 전체가 문제라면 코스·트랙 관리에서 숨김을 쓰세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setImages((list) =>
                  list.filter((image) => !selected.includes(image.id))
                )
                toast.success(`사진 ${selected.length}장 삭제됨`)
                setSelected([])
                setConfirming(false)
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
