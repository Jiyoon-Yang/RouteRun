"use client"

import { usePathname } from "next/navigation"

import { Separator } from "@/commons/components/ui/separator"
import { SidebarTrigger } from "@/commons/components/ui/sidebar"
import { findNavItem } from "@/commons/constants/nav"

export function SiteHeader() {
  const item = findNavItem(usePathname())

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <h1 className="text-sm font-medium">{item?.title}</h1>
    </header>
  )
}
