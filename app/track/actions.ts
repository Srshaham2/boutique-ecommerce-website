"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getOrderEvents } from "@/lib/orders"
import { trackingUrl } from "@/lib/email"

export type TrackedOrder = {
  orderNumber: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  createdAt: string
  events: { status: string; note: string | null; createdAt: string }[]
}

export type TrackResult =
  | { ok: true; order: TrackedOrder }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NOT_FOUND = "We couldn't find an order with that number and email."

/**
 * Public order lookup. Returns status + history only when the email matches the
 * order, so an order number alone can't be used to enumerate other customers.
 */
export async function lookupOrder(
  orderNumber: string,
  email: string
): Promise<TrackResult> {
  const num = orderNumber.trim().toUpperCase()
  const mail = email.trim().toLowerCase()
  if (!num || !EMAIL_RE.test(mail)) {
    return { ok: false, error: "Enter your order number and email address." }
  }

  const supabase = createAdminClient()
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_email, carrier, tracking_number, created_at"
    )
    .eq("order_number", num)
    .maybeSingle()

  if (error) {
    console.error("[lookupOrder] failed:", error)
    return { ok: false, error: "Something went wrong. Please try again." }
  }
  // Same message whether the number is wrong or the email doesn't match.
  if (!order || (order.customer_email ?? "").toLowerCase() !== mail) {
    return { ok: false, error: NOT_FOUND }
  }

  const events = await getOrderEvents(supabase, order.id)

  return {
    ok: true,
    order: {
      orderNumber: order.order_number,
      status: order.status,
      carrier: order.carrier,
      trackingNumber: order.tracking_number,
      trackingUrl:
        order.carrier && order.tracking_number
          ? trackingUrl(order.carrier, order.tracking_number)
          : null,
      createdAt: order.created_at,
      events: events.map((e) => ({
        status: e.status,
        note: e.note,
        createdAt: e.created_at,
      })),
    },
  }
}
