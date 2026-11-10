import { AdminLayout } from "@/commons/layout"
import { requireAdmin } from "@/lib/require-admin"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()

  return <AdminLayout email={admin.email ?? ""}>{children}</AdminLayout>
}
