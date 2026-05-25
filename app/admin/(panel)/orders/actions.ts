"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin/queries"
import { logOrderEvent } from "@/lib/orders"
import { sendOrderEmails, sendShipmentEmail } from "@/lib/email"
import { buildShippingLabelPdf } from "@/lib/shipping-label"
import type { OrderLineItem } from "@/lib/checkout"

type ActionResult =
  | { ok: true; emailSent?: boolean }
  | { ok: false; error: string }

function revalidateOrder(id: string) {
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath("/admin/orders")
  revalidatePath("/admin")
}

function orderDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Restock variants from an order's line items (best effort; needs product ids). */
async function restockItems(
  supabase: ReturnType<typeof createAdminClient>,
  items: OrderLineItem[]
) {
  const p_items = items
    .filter((i) => i.productId)
    .map((i) => ({
      product_id: i.productId as string,
      size: i.size,
      quantity: i.quantity,
    }))
  if (p_items.length) await supabase.rpc("increment_stock", { p_items })
}

/** Change order status. Cancelling restocks; delivering stamps delivered_at. */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult> {
  await requireAdmin()
  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status." }
  }
  const supabase = createAdminClient()

  const patch: Record<string, unknown> = { status }
  if (status === "delivered") patch.delivered_at = new Date().toISOString()

  let restocked = false
  if (status === "cancelled") {
    const { data: order } = await supabase
      .from("orders")
      .select("items, status")
      .eq("id", id)
      .maybeSingle()
    if (order && order.status !== "cancelled") {
      await restockItems(supabase, (order.items as OrderLineItem[]) ?? [])
      restocked = true
    }
  }

  const { error } = await supabase.from("orders").update(patch).eq("id", id)
  if (error) return { ok: false, error: "Couldn't update the order." }

  await logOrderEvent(
    supabase,
    id,
    status,
    status === "cancelled" && restocked ? "Items restocked" : null
  )
  revalidateOrder(id)
  return { ok: true }
}

/** Mark shipped with carrier + tracking and email the customer. */
export async function markShipped(
  id: string,
  carrier: string,
  trackingNumber: string
): Promise<ActionResult> {
  await requireAdmin()
  const c = carrier.trim()
  const t = trackingNumber.trim()
  if (!c || !t) return { ok: false, error: "Enter a carrier and tracking number." }

  const supabase = createAdminClient()
  const { data: order, error } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      carrier: c,
      tracking_number: t,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error || !order) return { ok: false, error: "Couldn't update the order." }

  await logOrderEvent(supabase, id, "shipped", `${c} · ${t}`)

  let emailSent = false
  try {
    await sendShipmentEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      carrier: c,
      trackingNumber: t,
      items: (order.items as OrderLineItem[]) ?? [],
    })
    emailSent = true
  } catch (err) {
    console.error(`[markShipped] ${order.order_number} shipment email failed:`, err)
  }

  revalidateOrder(id)
  return { ok: true, emailSent }
}

/** Regenerate the label and resend both order emails (shop + customer). */
export async function resendOrderEmails(id: string): Promise<ActionResult> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (!order) return { ok: false, error: "Order not found." }

  try {
    const date = orderDate(order.created_at)
    const labelPdf = await buildShippingLabelPdf({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      addressLine: order.address_line,
      city: order.city,
      state: order.state,
      zip: order.zip,
      phone: order.customer_phone,
      date,
    })
    await sendOrderEmails({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      phone: order.customer_phone,
      addressLine: order.address_line,
      city: order.city,
      state: order.state,
      zip: order.zip,
      items: (order.items as OrderLineItem[]) ?? [],
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      total: Number(order.total),
      date,
      labelPdf,
    })
    return { ok: true, emailSent: true }
  } catch (err) {
    console.error(`[resendOrderEmails] ${order.order_number} failed:`, err)
    return { ok: false, error: "Couldn't send the emails. Check email settings." }
  }
}

/** Save the manager's private notes on an order. */
export async function saveOrderNotes(
  id: string,
  notes: string
): Promise<ActionResult> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("orders")
    .update({ admin_notes: notes.trim() || null })
    .eq("id", id)
  if (error) return { ok: false, error: "Couldn't save notes." }
  revalidateOrder(id)
  return { ok: true }
}
