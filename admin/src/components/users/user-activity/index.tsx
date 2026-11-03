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
import { formatDistance, formatRelative } from "@/commons/utils/format"
import { contents, reports } from "@/commons/mocks"
import type { User } from "@/commons/types/admin"

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

export function WrittenList({ user }: { user: User }) {
  const written = contents.filter((content) => content.authorId === user.id)

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
            <Item key={content.id} size="sm" variant="outline">
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
                  {content.region} · {formatDistance(content.distanceMeters)} ·
                  좋아요 {content.likes}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      )}
    </section>
  )
}

export function ReportList({ user }: { user: User }) {
  const userReports = reports.filter((report) => report.userId === user.id)

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-medium">최근 보낸 제보</h3>
      {userReports.length === 0 ? (
        <p className="text-sm text-muted-foreground">보낸 제보가 없어요.</p>
      ) : (
        <ItemGroup>
          {userReports.map((report) => (
            <Item key={report.id} size="sm" variant="muted">
              <ItemContent>
                <ItemTitle className="line-clamp-1">{report.content}</ItemTitle>
                <ItemDescription>
                  {formatRelative(report.createdAt)}
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
