import type { Metadata } from "next"

import { requireAdmin } from "@/lib/admin/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export const metadata: Metadata = {
  title: "BieLux Backoffice",
  robots: { index: false, follow: false },
}

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-svh bg-background">
      <AdminSidebar email={admin.email} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
