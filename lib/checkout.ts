/**
 * Shared checkout pricing rules. Pure functions only (no server-only imports)
 * so this can be used by both the checkout UI and the server-side order action.
 */

/** Orders at or above this subtotal (USD) ship free. */
export const SHIPPING_THRESHOLD = 75

/** Flat shipping fee (USD) applied below the free-shipping threshold. */
export const SHIPPING_FEE = 8

/** Shipping charged for a given subtotal. An empty cart (subtotal 0) is free. */
export function shippingFor(subtotal: number): number {
  return subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE
}

/** A single resolved order line, as stored on the order and shown in emails. */
export type OrderLineItem = {
  name: string
  size: string | null
  quantity: number
  /** Unit price in USD. */
  price: number
  /** Product id, stored so the backoffice can restock on cancellation. */
  productId?: string
}
