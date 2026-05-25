"use client"

import * as React from "react"

import { lookupOrder, type TrackedOrder } from "@/app/track/actions"
import type { OrderStatus } from "@/lib/admin/constants"
import { OrderStatusBadge } from "@/components/admin/order-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TrackForm() {
  const [orderNumber, setOrderNumber] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [order, setOrder] = React.useState<TrackedOrder | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await lookupOrder(orderNumber, email)
      if (res.ok) {
        setOrder(res.order)
      } else {
        setOrder(null)
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="orderNumber">Order number</Label>
          <Input
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. BL-1023"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="The email on your order"
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Looking up…" : "Track order"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      {order ? <OrderResult order={order} /> : null}
    </div>
  )
}

function OrderResult({ order }: { order: TrackedOrder }) {
  const placed = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6 border-t pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {order.orderNumber}
          </h2>
          <p className="text-sm text-muted-foreground">Placed {placed}</p>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} />
      </div>

      {order.trackingNumber ? (
        <p className="text-sm">
          <span className="text-muted-foreground">
            {order.carrier} tracking:{" "}
          </span>
          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {order.trackingNumber}
            </a>
          ) : (
            order.trackingNumber
          )}
        </p>
      ) : null}

      {order.events.length > 0 ? (
        <ol className="space-y-4">
          {order.events.map((e, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-foreground" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <OrderStatusBadge status={e.status as OrderStatus} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {e.note ? (
                  <p className="mt-1 text-sm text-muted-foreground">{e.note}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
