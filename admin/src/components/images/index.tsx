"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOffIcon, TrashIcon } from "lucide-react"

import { PageNav } from "@/commons/components/page-nav"
import { ReasonDialog } from "@/commons/components/reason-dialog"
import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import { Checkbox } from "@/commons/components/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/commons/components/ui/empty"
import { Skeleton } from "@/commons/components/ui/skeleton"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/commons/components/ui/toggle-group"
import { IMAGE_PAGE_SIZE } from "@/commons/constants/content"
import type { ContentImage, ImageFilters } from "@/commons/types/admin"
import { formatRelative } from "@/commons/utils/format"
import { extractImagePath } from "@/commons/utils/storage"
import { cn } from "@/lib/utils"

import { useImages } from "./hooks/use-images"

// 같은 URL이 두 글에 있을 수 있어서 글까지 넣는다.
const keyOf = (image: ContentImage) =>
  `${image.kind}:${image.contentId}:${image.url}`

export function ImagesPage() {
  const [kind, setKind] = useState<ImageFilters["kind"]>("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const { images, total, isLoading, deleteImages } = useImages({ kind, page })

  if (!isLoading && !images) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>사진을 불러오지 못했습니다</EmptyTitle>
          <EmptyDescription>
            서버 로그와 SUPABASE_SERVICE_ROLE_KEY 설정을 확인하세요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const list = images ?? []
  // 삭제 뒤 다시 받은 목록에 없는 사진은 선택에서도 빠진다.
  const targets = list.filter((image) => selected.includes(keyOf(image)))
  const now = new Date().toISOString()
  const pageCount = Math.ceil(total / IMAGE_PAGE_SIZE)

  // 페이지·종류를 바꾸면 선택을 비운다. 화면에 안 보이는 사진까지 지워지지 않게.
  const changeView = (next: Partial<ImageFilters>) => {
    if (next.kind) setKind(next.kind)
    setPage(next.page ?? 1)
    setSelected([])
  }

  // 마지막 페이지 사진을 모두 지워 페이지가 사라지면, 남은 마지막 페이지로 옮긴다.
  // effect로 옮기면 빈 페이지가 한 번 그려져서 렌더 중에 바로 바꾼다.
  const lastPage = Math.max(1, pageCount)
  if (images && !isLoading && page > lastPage) changeView({ page: lastPage })

  function toggle(key: string) {
    setSelected((keys) =>
      keys.includes(key) ? keys.filter((x) => x !== key) : [...keys, key]
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          variant="outline"
          value={[kind]}
          onValueChange={(value) =>
            value[0] && changeView({ kind: value[0] as ImageFilters["kind"] })
          }
        >
          <ToggleGroupItem value="all">전체</ToggleGroupItem>
          <ToggleGroupItem value="course">코스</ToggleGroupItem>
          <ToggleGroupItem value="track">트랙</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-sm text-muted-foreground">
          최근 등록 글 순 · 사진을 눌러 선택
        </p>
        {targets.length > 0 && (
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
              {targets.length}장 삭제
            </Button>
          </div>
        )}
      </div>

      {images && <p className="text-sm text-muted-foreground">총 {total}장</p>}
      {!isLoading && list.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>사진이 없습니다</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {isLoading &&
            Array.from({ length: 12 }, (_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          {!isLoading &&
            list.map((image) => {
              const key = keyOf(image)
              const checked = selected.includes(key)
              return (
                <div
                  key={key}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg ring-offset-2 ring-offset-background",
                    checked && "ring-2 ring-destructive"
                  )}
                >
                  <button
                    type="button"
                    className="absolute inset-0"
                    aria-label={`${image.title} 사진 선택`}
                    aria-pressed={checked}
                    onClick={() => toggle(key)}
                  >
                    {extractImagePath(image.url) ? (
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 16vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      // 작성자가 REST로 넣은 다른 호스트 URL. 불러오면 관리자 IP가 그 서버에 남아서 주소만 보여 준다.
                      <span className="flex size-full flex-col items-center justify-center gap-1 bg-muted p-3 pb-14 text-xs text-muted-foreground">
                        <ImageOffIcon />
                        외부 이미지
                        <span className="line-clamp-2 break-all">
                          {image.url}
                        </span>
                      </span>
                    )}
                  </button>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(key)}
                    aria-label={`${image.title} 사진 선택`}
                    className={cn(
                      "absolute top-2 left-2 bg-background opacity-0 transition-opacity group-hover:opacity-100",
                      checked && "opacity-100"
                    )}
                  />
                  {image.isHidden && (
                    <Badge
                      variant="destructive"
                      className="pointer-events-none absolute top-2 right-2"
                    >
                      숨김
                    </Badge>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col bg-linear-to-t from-black/70 to-transparent p-2 pt-6 text-xs text-white">
                    <span className="truncate font-medium">{image.title}</span>
                    <span className="opacity-80">
                      {formatRelative(image.createdAt, now)}
                    </span>
                  </div>
                </div>
              )
            })}
        </div>
      )}
      <PageNav
        page={page}
        pageCount={pageCount}
        onPageChange={(target) => changeView({ page: target })}
      />

      <ReasonDialog
        open={confirming}
        title={`사진 ${targets.length}장을 삭제할까요?`}
        description="스토리지에서 지우고 해당 글의 사진 목록에서도 빠집니다. 되돌릴 수 없어요. 글 전체가 문제라면 코스·트랙 관리에서 숨김을 쓰세요."
        confirmLabel="삭제"
        placeholder="예: 개인정보 노출"
        onOpenChange={setConfirming}
        onConfirm={async (reason) => {
          const ok = await deleteImages(targets, reason)
          // 실패하면 다이얼로그와 입력한 사유를 그대로 두고 다시 시도하게 한다.
          if (ok) {
            setSelected([])
            setConfirming(false)
          }
          return ok
        }}
      />
    </>
  )
}
