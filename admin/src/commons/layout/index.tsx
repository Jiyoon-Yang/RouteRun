import { SidebarInset, SidebarProvider } from "@/commons/components/ui/sidebar"
import { SiteHeader } from "@/commons/layout/header"
import { AppSidebar } from "@/commons/layout/sidebar"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
