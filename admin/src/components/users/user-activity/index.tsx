import { ReportStatusBadge } from "@/commons/components/status-badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/commons/components/ui/avatar"
import { Badge } from "@/commons/components/ui/badge"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/commons/components/ui/item"
import { formatDateTime, formatDistance } from "@/commons/utils/format"
import type { Report, User, UserContent } from "@/commons/types/admin"

export function UserAvatar({
  user,
  className,
}: {
  user: User
  className?: string
}) {
  return (
    <Avatar className={className}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback>{user.nickname.slice(0, 1)}</AvatarFallback>
    </Avatar>
  )
}

export function WrittenList({ written }: { written: UserContent[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-medium">최근 작성한 글</h3>
      {written.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          작성한 코스·트랙이 없어요.
        </p>
      ) : (
        <ItemGroup>
          {written.map((content) => (
            <Item
              key={`${content.kind}-${content.id}`}
              size="sm"
              variant="outline"
            >
              <ItemContent>
                <ItemTitle>
                  <Badge variant="outline">
                    {content.kind === "course" ? "코스" : "트랙"}
                  </Badge>
                  <span className="line-clamp-1">{content.title}</span>
                  {content.isHidden && (
                    <Badge variant="destructive">숨김</Badge>
                  )}
                </ItemTitle>
                <ItemDescription>
                  {content.region ?? "지역 없음"} ·{" "}
                  {formatDistance(content.distanceMeters)} · 좋아요{" "}
                  {content.likes} · {formatDateTime(content.createdAt)}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      )}
    </section>
  )
}

export function ReportList({ reports }: { reports: Report[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-medium">최근 보낸 제보</h3>
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">보낸 제보가 없어요.</p>
      ) : (
        <ItemGroup>
          {reports.map((report) => (
            <Item key={report.id} size="sm" variant="muted">
              <ItemContent>
                <ItemTitle className="line-clamp-1">{report.content}</ItemTitle>
                <ItemDescription>
                  {formatDateTime(report.createdAt)}
                </ItemDescription>
              </ItemContent>
              <ReportStatusBadge status={report.status} />
            </Item>
          ))}
        </ItemGroup>
      )}
    </section>
  )
}
