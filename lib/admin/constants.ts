/**
 * Shared admin constants and types — safe to import from both server and client
 * components (no "server-only" here, unlike ./queries).
 */

export const ORDER_STATUSES = [
  "new",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Stock at or below this is flagged "low" in the backoffice. */
export const LOW_STOCK_THRESHOLD = 5
