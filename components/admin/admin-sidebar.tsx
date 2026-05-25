"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Tags,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: Tags },
]

export function AdminSidebar({ email }: { email: string | null }) {
  const pathname = usePathname()

  async function signOut() {
    await createClient().auth.signOut()
    window.location.assign("/admin/login")
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/30">
      <div className="border-b px-6 py-5">
        <span className="font-script text-3xl">BieLux</span>
        <p className="text-xs tracking-widest text-muted-foreground">BACKOFFICE</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        {email && (
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground" title={email}>
            {email}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
