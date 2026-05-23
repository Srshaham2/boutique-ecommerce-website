import Link from "next/link"

import { Logo } from "@/components/logo"

const columns = [
  {
    title: "Shop",
    links: [
      { label: "Dresses", href: "/shop?category=dresses" },
      { label: "Sets", href: "/shop?category=sets" },
      { label: "Pants", href: "/shop?category=pants" },
      { label: "Shoes", href: "/shop?category=shoes" },
      { label: "Accessories", href: "/shop?category=accessories" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact Us", href: "#" },
      { label: "Shipping", href: "#" },
      { label: "Returns", href: "#" },
      { label: "Size Guide", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Stockists", href: "#" },
      { label: "Sustainability", href: "#" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        {/* Newsletter */}
        <div className="flex flex-col items-center text-center">
          <h2 className="font-heading text-3xl font-medium">
            Join the club
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Sign up for early access to new drops, members-only offers and a
            little sunshine in your inbox.
          </p>
          <form className="mt-6 flex w-full max-w-md items-center gap-2">
            <input
              type="email"
              required
              placeholder="Email address"
              className="h-11 flex-1 border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <button
              type="submit"
              className="h-11 bg-foreground px-6 text-xs font-medium uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="mt-14 grid gap-10 border-t pt-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo fallbackClassName="text-4xl" imgClassName="h-10" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Considered luxury for the everyday. Designed to be worn, loved and
              worn again.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} BieLux. All rights reserved.
          </span>
          <span className="flex gap-4">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
