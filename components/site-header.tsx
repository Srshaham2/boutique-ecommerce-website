"use client"

import * as React from "react"
import Link from "next/link"
import { MenuIcon, SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useCart } from "@/components/cart/cart-provider"
import { Logo } from "@/components/logo"
import { CartSheet } from "@/components/cart/cart-sheet"
import { SearchDialog } from "@/components/search-dialog"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
  { label: "All", href: "/shop" },
  { label: "Dresses", href: "/shop?category=dresses" },
  { label: "Sets", href: "/shop?category=sets" },
  { label: "Pants", href: "/shop?category=pants" },
  { label: "Shoes", href: "/shop?category=shoes" },
  { label: "Accessories", href: "/shop?category=accessories" },
]

export function SiteHeader() {
  const { count, openCart, hydrated } = useCart()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)

  // ⌘K / Ctrl+K opens search
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Top row: mobile menu / logo / utilities */}
        <div className="grid h-28 grid-cols-[1fr_auto_1fr] items-center gap-2 sm:h-32">
          {/* Left — mobile menu */}
          <div className="flex items-center justify-start lg:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <MenuIcon className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <Logo imgClassName="h-9" fallbackClassName="text-3xl" />
                </SheetHeader>
                <nav className="mt-2 flex flex-col px-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="border-b py-2 font-script text-3xl text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden lg:block" />

          {/* Center — logo */}
          <div className="flex items-center justify-center">
            <Logo />
          </div>

          {/* Right — utilities */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <span className="mr-1 hidden text-sm text-foreground/70 md:inline">
              USD $
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Account"
              nativeButton={false}
              render={<Link href="/account" />}
            >
              <UserIcon className="size-5" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className="size-5" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Cart${count ? `, ${count} items` : ""}`}
              onClick={openCart}
              className="relative"
            >
              <ShoppingBagIcon className="size-5" strokeWidth={1.5} />
              {hydrated && count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                  {count}
                </span>
              ) : null}
            </Button>
          </div>
        </div>

        {/* Bottom row: centered nav (desktop), set in the brand script */}
        <nav className="hidden items-end justify-center gap-12 pb-3 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "font-script text-3xl leading-none text-foreground/80 transition-colors hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Global overlays */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <CartSheet />
    </header>
  )
}
