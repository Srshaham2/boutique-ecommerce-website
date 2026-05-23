"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon } from "lucide-react"

const priceOptions = [
  { label: "Any price", value: "" },
  { label: "Under $40", value: "40" },
  { label: "Under $75", value: "75" },
  { label: "Under $100", value: "100" },
]

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A–Z", value: "name" },
]

const selectClass =
  "h-10 border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"

export function ShopControls() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQ = searchParams.get("q") ?? ""

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = new FormData(e.currentTarget).get("q")
    setParam("q", String(value ?? "").trim())
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={onSearch} className="relative w-full sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          // Reset the field to the active query whenever the URL changes
          key={currentQ}
          name="q"
          type="search"
          defaultValue={currentQ}
          placeholder="Search this collection…"
          className="h-10 w-full border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </form>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="price-filter">
          Filter by price
        </label>
        <select
          id="price-filter"
          className={selectClass}
          value={searchParams.get("max") ?? ""}
          onChange={(e) => setParam("max", e.target.value)}
        >
          {priceOptions.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="sort-control">
          Sort
        </label>
        <select
          id="sort-control"
          className={selectClass}
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => setParam("sort", e.target.value)}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
