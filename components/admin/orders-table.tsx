"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

import type { AdminOrder } from "@/lib/admin/queries"
import {
  ORDER_STATUSES,
  type OrderStatus,
  type OrderSortKey,
  type SortDir,
} from "@/lib/admin/constants"
import { formatPrice, cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SortHeader } from "@/components/admin/sort-header"
import { OrderStatusSelect } from "@/components/admin/order-status-select"
import { Pagination } from "@/components/admin/pagination"
import { useTableParams } from "@/components/admin/use-table-params"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function OrdersTable({
  rows,
  total,
  page,
  pageCount,
  pageSize,
  q,
  status,
  sort,
  dir,
}: {
  rows: AdminOrder[]
  total: number
  page: number
  pageCount: number
  pageSize: number
  q: string
  status?: OrderStatus
  sort?: OrderSortKey
  dir: SortDir
}) {
  const { pending, update } = useTableParams()

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

  function onSort(key: OrderSortKey) {
    const nextDir: SortDir = sort === key && dir === "asc" ? "desc" : "asc"
    update({ sort: key, dir: nextDir, page: null })
  }

  function header(
    key: OrderSortKey,
    label: string,
    align?: "right",
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

  const filters: { label: string; value?: OrderStatus }[] = [
    { label: "All" },
    ...ORDER_STATUSES.map((s) => ({ label: s, value: s })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => update({ status: f.value ?? null, page: null })}
            className={cn(
              "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
              f.value === status
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by order #, name or email…"
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
              {header("order", "Order")}
              {header("customer", "Customer")}
              {header("date", "Date")}
              {header("status", "Status")}
              {header("total", "Total", "right", "text-right")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${o.id}`} className="block">
                    {o.order_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/orders/${o.id}`} className="block">
                    {o.customer_name}
                    <span className="block text-xs text-muted-foreground">
                      {o.customer_email}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/admin/orders/${o.id}`} className="block">
                    {formatDate(o.created_at)}
                  </Link>
                </TableCell>
                <TableCell>
                  <OrderStatusSelect id={o.id} status={o.status} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  <Link href={`/admin/orders/${o.id}`} className="block">
                    {formatPrice(o.total)}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
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
