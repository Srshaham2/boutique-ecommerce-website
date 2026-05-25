import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getOrder, type OrderStatus } from "@/lib/admin/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import { getOrderEvents } from "@/lib/orders"
import { formatPrice } from "@/lib/utils"
import { trackingUrl } from "@/lib/email"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge } from "@/components/admin/order-status-badge"
import { OrderActions } from "@/components/admin/order-actions"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  const events = await getOrderEvents(createAdminClient(), id)

  const placed = new Date(order.created_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const track =
    order.carrier && order.tracking_number
      ? trackingUrl(order.carrier, order.tracking_number)
      : null

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">Placed {placed}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.size ? `Size ${item.size} · ` : ""}Qty {item.quantity}
                        {" · "}
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatPrice(order.total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{order.customer_name}</p>
                <p>
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="text-muted-foreground hover:underline"
                  >
                    {order.customer_email}
                  </a>
                </p>
                <p className="text-muted-foreground">{order.customer_phone}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ship to</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5 text-sm">
                <p>{order.address_line}</p>
                <p>
                  {order.city}, {order.state} {order.zip}
                </p>
              </CardContent>
            </Card>
          </div>

          {(order.carrier || order.shipped_at) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {order.carrier && (
                  <p>
                    <span className="text-muted-foreground">Carrier: </span>
                    {order.carrier}
                  </p>
                )}
                {order.tracking_number && (
                  <p>
                    <span className="text-muted-foreground">Tracking: </span>
                    {track ? (
                      <a
                        href={track}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {order.tracking_number}
                      </a>
                    ) : (
                      order.tracking_number
                    )}
                  </p>
                )}
                {order.shipped_at && (
                  <p>
                    <span className="text-muted-foreground">Shipped: </span>
                    {new Date(order.shipped_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">History</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-start gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-foreground" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <OrderStatusBadge status={e.status as OrderStatus} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(e.created_at).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        {e.note ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {e.note}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        <OrderActions
          id={order.id}
          status={order.status}
          carrier={order.carrier}
          trackingNumber={order.tracking_number}
          adminNotes={order.admin_notes}
        />
      </div>
    </div>
  )
}
