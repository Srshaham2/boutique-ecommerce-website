"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

import type { AdminProduct } from "@/lib/admin/queries"
import {
  LOW_STOCK_THRESHOLD,
  type ProductSortKey,
  type SortDir,
} from "@/lib/admin/constants"
import { formatPrice, priceView, cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortHeader } from "@/components/admin/sort-header"
import { PublishSwitch } from "@/components/admin/publish-switch"
import { Pagination } from "@/components/admin/pagination"
import { useTableParams } from "@/components/admin/use-table-params"

export function ProductsTable({
  rows,
  total,
  page,
  pageCount,
  pageSize,
  q,
  sort,
  dir,
}: {
  rows: AdminProduct[]
  total: number
  page: number
  pageCount: number
  pageSize: number
  q: string
  sort?: ProductSortKey
  dir: SortDir
}) {
  const { pending, update } = useTableParams()

  // Local search text, debounced into the URL. Resync if `q` changes via
  // navigation (back button), without clobbering in-progress typing.
  const [term, setTerm] = useState(q)
  const [syncedQ, setSyncedQ] = useState(q)
  if (syncedQ !== q) {
    setSyncedQ(q)
    setTerm(q)
  }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onSearch(value: string) {
    setTerm(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => update({ q: value || null, page: null }), 350)
  }

  function onSort(key: ProductSortKey) {
    const nextDir: SortDir = sort === key && dir === "asc" ? "desc" : "asc"
    update({ sort: key, dir: nextDir, page: null })
  }

  function header(
    key: ProductSortKey,
    label: string,
    align?: "right" | "center",
    className?: string
  ) {
    return (
      <SortHeader
        label={label}
        active={sort === key}
        dir={sort === key ? dir : "asc"}
        onSort={() => onSort(key)}
        align={align}
        className={className}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, category or description…"
          className="pl-9"
        />
      </div>

      <div
        className={cn(
          "rounded-lg border transition-opacity",
          pending && "opacity-60"
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14" />
              {header("name", "Name")}
              {header("category", "Category")}
              {header("price", "Price", "right", "text-right")}
              {header("stock", "Stock", "right", "text-right")}
              {header("published", "Published", "center", "text-center")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
            {rows.map((p) => {
              const pv = priceView(p.price, p.sale_price)
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image_url}
                        alt=""
                        className="size-10 rounded object-cover"
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {pv.onSale ? (
                      <span>
                        <span className="font-medium">{formatPrice(pv.current)}</span>{" "}
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(pv.original)}
                        </span>
                      </span>
                    ) : (
                      formatPrice(pv.current)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium",
                        p.stock_quantity === 0 && "text-destructive",
                        p.stock_quantity > 0 &&
                          p.stock_quantity <= LOW_STOCK_THRESHOLD &&
                          "text-amber-700"
                      )}
                    >
                      {p.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <PublishSwitch id={p.id} checked={p.in_stock} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        total={total}
        disabled={pending}
        onPage={(p) => update({ page: p <= 1 ? null : p })}
      />
    </div>
  )
}
