import Link from "next/link"
import { AlertTriangle, DollarSign, Package, ShoppingBag } from "lucide-react"

import { getDashboardMetrics } from "@/lib/admin/queries"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/admin/order-status-badge"
import { RevenueChart } from "@/components/admin/revenue-chart"

export default async function DashboardPage() {
  const m = await getDashboardMetrics()

  const kpis = [
    {
      label: "Revenue",
      value: formatPrice(m.revenue),
      icon: DollarSign,
      hint: "Excludes cancelled",
    },
    { label: "Orders", value: String(m.orderCount), icon: ShoppingBag },
    { label: "Products", value: String(m.productCount), icon: Package },
    {
      label: "Low stock",
      value: String(m.lowStockCount),
      icon: AlertTriangle,
      hint: "≤ 5 units",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Store overview at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{k.value}</div>
              {k.hint && (
                <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue · last 14 days</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground">
            <RevenueChart data={m.revenueByDay} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(m.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <OrderStatusBadge status={status as never} />
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {m.recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {m.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
              >
                <span className="font-medium">{o.order_number}</span>
                <span className="flex-1 truncate px-3 text-muted-foreground">
                  {o.customer_name}
                </span>
                <span className="mr-3">
                  <OrderStatusBadge status={o.status} />
                </span>
                <span className="font-medium">{formatPrice(o.total)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Low stock</CardTitle>
            <Link
              href="/admin/inventory"
              className="text-sm text-muted-foreground hover:underline"
            >
              Manage
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {m.lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Everything is well stocked.
              </p>
            )}
            {m.lowStock.map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
              >
                <span className="flex-1 truncate pr-3">{p.name}</span>
                <span
                  className={
                    p.stock_quantity === 0
                      ? "font-semibold text-destructive"
                      : "font-medium text-amber-700"
                  }
                >
                  {p.stock_quantity} left
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
