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

// ── Paged-table sorting ───────────────────────────────────────────────────────
// Shared between the server queries and the client tables (URL-driven sorting).

export const SORT_DIRS = ["asc", "desc"] as const
export type SortDir = (typeof SORT_DIRS)[number]

/** Rows per page in the backoffice product/order tables. */
export const PAGE_SIZE = 20

export const PRODUCT_SORT_KEYS = [
  "name",
  "category",
  "price",
  "stock",
  "published",
] as const
export type ProductSortKey = (typeof PRODUCT_SORT_KEYS)[number]

export const ORDER_SORT_KEYS = [
  "order",
  "customer",
  "date",
  "status",
  "total",
] as const
export type OrderSortKey = (typeof ORDER_SORT_KEYS)[number]
