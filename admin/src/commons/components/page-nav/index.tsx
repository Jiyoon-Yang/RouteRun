"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/commons/components/ui/pagination"

// 페이지 번호를 생략 없이 모두 나열한다. 한 페이지뿐이면 그리지 않는다.
export function PageNav({
  page,
  pageCount,
  onPageChange,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  // shadcn 페이지 링크는 <a>라서 href가 있어야 키보드로 포커스·Enter가 된다. 주소는 바꾸지 않고 상태만 바꾼다.
  const linkProps = (target: number, disabled = false) => ({
    href: "#",
    "aria-disabled": disabled || undefined,
    tabIndex: disabled ? -1 : undefined,
    className: disabled ? "pointer-events-none opacity-50" : undefined,
    onClick: (event: React.MouseEvent) => {
      event.preventDefault()
      if (!disabled) onPageChange(target)
    },
  })

  return (
    <Pagination aria-label="페이지 이동">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text="이전"
            aria-label="이전 페이지"
            {...linkProps(page - 1, page === 1)}
          />
        </PaginationItem>
        {Array.from({ length: pageCount }, (_, index) => (
          <PaginationItem key={index}>
            <PaginationLink
              isActive={index + 1 === page}
              {...linkProps(index + 1)}
            >
              {index + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            text="다음"
            aria-label="다음 페이지"
            {...linkProps(page + 1, page === pageCount)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
