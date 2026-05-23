"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { shippingFor, type OrderLineItem } from "@/lib/checkout"
import { sendOrderEmails } from "@/lib/email"
import { buildShippingLabelPdf } from "@/lib/shipping-label"

/** What the checkout form submits. Prices/names are NOT trusted from here. */
export type PlaceOrderInput = {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  /** Cart lines — only the product id, size and quantity are trusted. */
  items: { id: string; size: string | null; quantity: number }[]
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  // ── Validate ────────────────────────────────────────────────────────────
  const email = input.email?.trim()
  const firstName = input.firstName?.trim()
  const lastName = input.lastName?.trim()
  const phone = input.phone?.trim()
  const address = input.address?.trim()
  const city = input.city?.trim()
  const state = input.state?.trim()
  const zip = input.zip?.trim()

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." }
  }
  if (!firstName || !lastName || !phone || !address || !city || !state || !zip) {
    return { ok: false, error: "Please fill in all contact and shipping fields." }
  }
  if (!input.items?.length) {
    return { ok: false, error: "Your cart is empty." }
  }

  const supabase = createAdminClient()

  // ── Resolve authoritative prices/names from the DB (never trust the client) ─
  const ids = [...new Set(input.items.map((i) => i.id))]
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price")
    .in("id", ids)

  if (productsError) {
    console.error("[placeOrder] failed to load products:", productsError)
    return { ok: false, error: "Something went wrong. Please try again." }
  }

  const byId = new Map(products?.map((p) => [p.id, p]))
  const lineItems: OrderLineItem[] = []
  for (const item of input.items) {
    const product = byId.get(item.id)
    const quantity = Math.max(1, Math.floor(item.quantity))
    if (!product) {
      return { ok: false, error: "One or more items are no longer available." }
    }
    lineItems.push({
      name: product.name,
      size: item.size,
      quantity,
      price: Number(product.price),
    })
  }

  const subtotal = round2(
    lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )
  const shipping = shippingFor(subtotal)
  const total = round2(subtotal + shipping)
  const customerName = `${firstName} ${lastName}`

  // ── Persist the order (the DB assigns the sequential order_number) ─────────
  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_email: email,
      customer_phone: phone,
      address_line: address,
      city,
      state,
      zip,
      items: lineItems,
      subtotal,
      shipping,
      total,
    })
    .select("order_number")
    .single()

  if (insertError || !order) {
    console.error("[placeOrder] failed to save order:", insertError)
    return { ok: false, error: "We couldn't save your order. Please try again." }
  }

  const orderNumber = order.order_number as string
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // ── Generate the label + send both emails. ─────────────────────────────────
  // The order is already saved, so an email/PDF failure must NOT make the
  // customer resubmit (and double-order). We log loudly instead and still
  // confirm the order; the record is the source of truth.
  try {
    const labelPdf = await buildShippingLabelPdf({
      orderNumber,
      customerName,
      addressLine: address,
      city,
      state,
      zip,
      phone,
      date,
    })

    await sendOrderEmails({
      orderNumber,
      customerName,
      customerEmail: email,
      phone,
      addressLine: address,
      city,
      state,
      zip,
      items: lineItems,
      subtotal,
      shipping,
      total,
      date,
      labelPdf,
    })
  } catch (err) {
    console.error(
      `[placeOrder] order ${orderNumber} saved but email/PDF failed:`,
      err
    )
  }

  return { ok: true, orderNumber }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
