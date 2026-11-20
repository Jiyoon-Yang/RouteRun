"use client"

import Image from "next/image"
import {
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  ImageOffIcon,
} from "lucide-react"

import { Badge } from "@/commons/components/ui/badge"
import { Button } from "@/commons/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/commons/components/ui/sheet"
import { USER_SITE_URL } from "@/commons/constants/content"
import { formatDate, formatDistance } from "@/commons/utils/format"
import { extractImagePath } from "@/commons/utils/storage"
import type { Content } from "@/commons/types/admin"

/** 코스·트랙 한 개를 목록에서 받은 그대로 펼쳐 보여 준다. 경로 지도는 아직 없다. */
export function ContentDetailSheet({
  content,
  onClose,
  onHide,
  onUnhide,
}: {
  content: Content | null
  onClose: () => void
  onHide: (id: string) => void
  onUnhide: (id: string) => void
}) {
  return (
    <Sheet open={content !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="data-[side=right]:sm:max-w-lg">
        {content && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {content.kind === "course" ? "코스" : "트랙"}
                </Badge>
                {content.isHidden ? (
                  <Badge variant="destructive">숨김</Badge>
                ) : (
                  <Badge variant="outline">공개</Badge>
                )}
              </div>
              <SheetTitle className="pr-8 text-lg break-all">
                {content.title}
              </SheetTitle>
              <SheetDescription>
                {content.author.nickname}
                {content.author.isAnonymous && " · 게스트"} ·{" "}
                {formatDate(content.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 overflow-y-auto px-4">
              <dl className="grid grid-cols-3 gap-3 rounded-lg border p-3">
                <Stat label="지역" value={content.region ?? "—"} />
                <Stat
                  label="거리"
                  value={formatDistance(content.distanceMeters)}
                />
                <Stat label="좋아요" value={String(content.likes)} />
              </dl>

              <p className="leading-relaxed break-all whitespace-pre-wrap">
                {content.description || (
                  <span className="text-muted-foreground">설명 없음</span>
                )}
              </p>

              {content.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {content.imageUrls.map((url) =>
                    extractImagePath(url) ? (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-square overflow-hidden rounded-lg"
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          sizes="240px"
                          className="object-cover"
                        />
                      </a>
                    ) : (
                      // 다른 호스트 URL은 불러오면 관리자 IP가 그 서버에 남아서 주소만 보여 준다(이미지 검수와 같은 규칙).
                      <span
                        key={url}
                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg bg-muted p-3 text-xs text-muted-foreground"
                      >
                        <ImageOffIcon />
                        외부 이미지
                        <span className="line-clamp-3 break-all">{url}</span>
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            <SheetFooter className="flex-row justify-end border-t">
              {/* 숨긴 글은 사용자 앱에서 작성자에게만 보여서 링크를 열어도 관리자는 볼 수 없다. */}
              {!content.isHidden && (
                <Button
                  variant="outline"
                  render={
                    <a
                      href={`${USER_SITE_URL}/${content.kind === "course" ? "courses" : "tracks"}/${content.id}`}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                  nativeButton={false}
                >
                  <ExternalLinkIcon data-icon="inline-start" />
                  사용자 앱에서 보기
                </Button>
              )}
              {content.isHidden ? (
                <Button variant="outline" onClick={() => onUnhide(content.id)}>
                  <EyeIcon data-icon="inline-start" />
                  숨김 해제
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => onHide(content.id)}
                >
                  <EyeOffIcon data-icon="inline-start" />
                  숨김
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium tabular-nums">{value}</dd>
    </div>
  )
}
