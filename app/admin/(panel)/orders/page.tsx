import { listOrdersPage } from "@/lib/admin/queries"
import {
  ORDER_STATUSES,
  ORDER_SORT_KEYS,
  type OrderStatus,
  type OrderSortKey,
  type SortDir,
} from "@/lib/admin/constants"
import { OrdersTable } from "@/components/admin/orders-table"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    q?: string
    sort?: string
    dir?: string
    page?: string
  }>
}) {
  const sp = await searchParams
  const q = sp.q ?? ""
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus)
    ? (sp.status as OrderStatus)
    : undefined
  const sort = ORDER_SORT_KEYS.includes(sp.sort as OrderSortKey)
    ? (sp.sort as OrderSortKey)
    : undefined
  const dir: SortDir = sp.dir === "desc" ? "desc" : "asc"
  const requestedPage = Math.max(1, Number(sp.page) || 1)

  const { rows, total, page, pageCount, pageSize } = await listOrdersPage({
    status,
    q,
    sort,
    dir,
    page: requestedPage,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {total} {status ? `"${status}"` : ""} order{total === 1 ? "" : "s"}
        </p>
      </div>

      <OrdersTable
        rows={rows}
        total={total}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        q={q}
        status={status}
        sort={sort}
        dir={dir}
      />
    </div>
  )
}
