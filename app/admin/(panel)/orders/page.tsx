import Link from "next/link"

import {
  listOrders,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/admin/queries"
import { formatPrice, cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrderStatusBadge } from "@/components/admin/order-status-badge"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const active = ORDER_STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined
  const orders = await listOrders({ status: active })

  const filters: { label: string; value?: OrderStatus }[] = [
    { label: "All" },
    ...ORDER_STATUSES.map((s) => ({ label: s, value: s })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} {active ? `"${active}"` : ""} order
          {orders.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = f.value === active
          return (
            <Link
              key={f.label}
              href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
              className={cn(
                "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No orders here yet.
                </TableCell>
              </TableRow>
            )}
            {orders.map((o) => (
              <TableRow key={o.id} className="cursor-pointer">
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
                    {new Date(o.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/orders/${o.id}`} className="block">
                    <OrderStatusBadge status={o.status} />
                  </Link>
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
    </div>
  )
}
