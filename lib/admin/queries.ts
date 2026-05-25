import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { OrderLineItem } from "@/lib/checkout"
import type { Category, Variant } from "@/lib/products"
import { asSizeType } from "@/lib/sizes"
import {
  ORDER_STATUSES,
  LOW_STOCK_THRESHOLD,
  PAGE_SIZE,
  type OrderStatus,
  type ProductSortKey,
  type OrderSortKey,
  type SortDir,
} from "@/lib/admin/constants"

export { ORDER_STATUSES, LOW_STOCK_THRESHOLD, PAGE_SIZE }
export type { OrderStatus, ProductSortKey, OrderSortKey, SortDir }

/** One page of results plus the totals needed to render pagination. */
export type Paged<T> = {
  rows: T[]
  total: number
  page: number
  pageCount: number
  pageSize: number
}

/** Clamp an incoming page to a valid 1-based index and return the row range. */
function pageRange(page: number, pageSize: number, total: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const clamped = Math.min(Math.max(1, page), pageCount)
  const from = (clamped - 1) * pageSize
  return { page: clamped, pageCount, from, to: from + pageSize - 1 }
}

/** Escape PostgREST `.or()` grammar so user search text can't break the filter. */
function ilikeTerm(q: string): string {
  return `%${q.trim().replace(/[,()*]/g, " ")}%`
}

export type AdminOrder = {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  address_line: string
  city: string
  state: string
  zip: string
  items: OrderLineItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  tracking_number: string | null
  carrier: string | null
  shipped_at: string | null
  delivered_at: string | null
  admin_notes: string | null
  created_at: string
}

export type AdminProduct = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  sale_price: number | null
  category_id: string | null
  image_url: string
  hover_image_url: string | null
  badge: string | null
  is_new: boolean
  is_most_wanted: boolean
  in_stock: boolean
  stock_quantity: number
  created_at: string
  category: { name: string; slug: string; size_type: string } | null
  variants: Variant[]
}

function numbersOnOrder(row: Record<string, unknown>): AdminOrder {
  return {
    ...(row as AdminOrder),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    items: (row.items as OrderLineItem[]) ?? [],
  }
}

function numbersOnProduct(row: Record<string, unknown>): AdminProduct {
  const variants = ((row.variants as Record<string, unknown>[]) ?? [])
    .map((v) => ({
      id: v.id as string,
      size: (v.size as string | null) ?? null,
      stock_quantity: Number(v.stock_quantity),
      sort_order: Number(v.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ id, size, stock_quantity }) => ({ id, size, stock_quantity }))

  return {
    ...(row as AdminProduct),
    price: Number(row.price),
    sale_price: row.sale_price == null ? null : Number(row.sale_price),
    stock_quantity: Number(row.stock_quantity),
    variants,
  }
}

// ── Orders ──────────────────────────────────────────────────────────────────

export async function listOrders(opts: { status?: OrderStatus } = {}): Promise<
  AdminOrder[]
> {
  const supabase = createAdminClient()
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (opts.status) query = query.eq("status", opts.status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(numbersOnOrder)
}

export async function getOrder(id: string): Promise<AdminOrder | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data ? numbersOnOrder(data) : null
}

const ORDER_SORT_COLUMNS: Record<OrderSortKey, string> = {
  order: "order_number",
  customer: "customer_name",
  date: "created_at",
  status: "status",
  total: "total",
}

/** One page of orders, filtered/searched/sorted entirely in the database. */
export async function listOrdersPage(opts: {
  status?: OrderStatus
  q?: string
  sort?: OrderSortKey
  dir?: SortDir
  page?: number
  pageSize?: number
} = {}): Promise<Paged<AdminOrder>> {
  const supabase = createAdminClient()
  const pageSize = opts.pageSize ?? PAGE_SIZE
  const term = opts.q?.trim() ? ilikeTerm(opts.q) : null
  const search = term
    ? `order_number.ilike.${term},customer_name.ilike.${term},customer_email.ilike.${term}`
    : null

  let countQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
  if (opts.status) countQuery = countQuery.eq("status", opts.status)
  if (search) countQuery = countQuery.or(search)
  const { count, error: countError } = await countQuery
  if (countError) throw countError

  const total = count ?? 0
  const { page, pageCount, from, to } = pageRange(opts.page ?? 1, pageSize, total)

  const column = opts.sort ? ORDER_SORT_COLUMNS[opts.sort] : "created_at"
  const ascending = opts.sort ? opts.dir !== "desc" : false
  let dataQuery = supabase.from("orders").select("*")
  if (opts.status) dataQuery = dataQuery.eq("status", opts.status)
  if (search) dataQuery = dataQuery.or(search)
  const { data, error } = await dataQuery
    // Stable tiebreaker keeps paging deterministic when sort values tie.
    .order(column, { ascending })
    .order("id", { ascending: true })
    .range(from, to)
  if (error) throw error
  return { rows: (data ?? []).map(numbersOnOrder), total, page, pageCount, pageSize }
}

// ── Products ────────────────────────────────────────────────────────────────

const ADMIN_PRODUCT_SELECT =
  "*, category:categories(name, slug, size_type), variants:product_variants(id, size, stock_quantity, sort_order)"

export async function listProducts(opts: { q?: string } = {}): Promise<
  AdminProduct[]
> {
  const supabase = createAdminClient()
  let query = supabase
    .from("products")
    .select(ADMIN_PRODUCT_SELECT)
    .order("created_at", { ascending: false })

  if (opts.q) {
    const term = `%${opts.q}%`
    query = query.or(`name.ilike.${term},description.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(numbersOnProduct)
}

// Maps a row from the flattened `admin_product_list` view back to AdminProduct.
// The list view carries no per-size variants, so `variants` is left empty.
function viewRowToProduct(row: Record<string, unknown>): AdminProduct {
  const categoryName = (row.category_name as string | null) ?? null
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    price: Number(row.price),
    sale_price: row.sale_price == null ? null : Number(row.sale_price),
    category_id: (row.category_id as string | null) ?? null,
    image_url: row.image_url as string,
    hover_image_url: (row.hover_image_url as string | null) ?? null,
    badge: (row.badge as string | null) ?? null,
    is_new: Boolean(row.is_new),
    is_most_wanted: Boolean(row.is_most_wanted),
    in_stock: Boolean(row.in_stock),
    stock_quantity: Number(row.stock_quantity),
    created_at: row.created_at as string,
    category: categoryName
      ? {
          name: categoryName,
          slug: row.category_slug as string,
          size_type: row.category_size_type as string,
        }
      : null,
    variants: [],
  }
}

const PRODUCT_SORT_COLUMNS: Record<ProductSortKey, string> = {
  name: "name",
  category: "category_name",
  price: "effective_price",
  stock: "stock_quantity",
  published: "in_stock",
}

/**
 * One page of products, filtered/searched/sorted in the database. Reads the
 * `admin_product_list` view so it can sort by category name and sale-aware
 * price — columns PostgREST can't order on the base `products` table.
 */
export async function listProductsPage(opts: {
  q?: string
  sort?: ProductSortKey
  dir?: SortDir
  page?: number
  pageSize?: number
} = {}): Promise<Paged<AdminProduct>> {
  const supabase = createAdminClient()
  const pageSize = opts.pageSize ?? PAGE_SIZE
  const term = opts.q?.trim() ? ilikeTerm(opts.q) : null
  const search = term
    ? `name.ilike.${term},description.ilike.${term},category_name.ilike.${term}`
    : null

  let countQuery = supabase
    .from("admin_product_list")
    .select("id", { count: "exact", head: true })
  if (search) countQuery = countQuery.or(search)
  const { count, error: countError } = await countQuery
  if (countError) throw countError

  const total = count ?? 0
  const { page, pageCount, from, to } = pageRange(opts.page ?? 1, pageSize, total)

  const column = opts.sort ? PRODUCT_SORT_COLUMNS[opts.sort] : "created_at"
  const ascending = opts.sort ? opts.dir !== "desc" : false
  let dataQuery = supabase.from("admin_product_list").select("*")
  if (search) dataQuery = dataQuery.or(search)
  const { data, error } = await dataQuery
    .order(column, { ascending })
    .order("id", { ascending: true })
    .range(from, to)
  if (error) throw error
  return {
    rows: (data ?? []).map(viewRowToProduct),
    total,
    page,
    pageCount,
    pageSize,
  }
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data ? numbersOnProduct(data) : null
}

export async function listLowStock(): Promise<AdminProduct[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_PRODUCT_SELECT)
    .lte("stock_quantity", LOW_STOCK_THRESHOLD)
    .order("stock_quantity", { ascending: true })
  if (error) throw error
  return (data ?? []).map(numbersOnProduct)
}

// ── Categories ──────────────────────────────────────────────────────────────

export type AdminCategory = Category & { product_count: number }

export async function listCategories(): Promise<AdminCategory[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order", { ascending: true })
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => {
    const products = row.products as { count: number }[] | undefined
    return {
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      sort_order: Number(row.sort_order),
      size_type: asSizeType(row.size_type as string),
      product_count: products?.[0]?.count ?? 0,
    }
  })
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export type DashboardMetrics = {
  revenue: number
  orderCount: number
  productCount: number
  lowStockCount: number
  statusCounts: Record<OrderStatus, number>
  recentOrders: AdminOrder[]
  lowStock: AdminProduct[]
  /** Last 14 days of revenue, oldest first, for the chart. */
  revenueByDay: { date: string; revenue: number }[]
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [orders, products, lowStock] = await Promise.all([
    listOrders(),
    listProducts(),
    listLowStock(),
  ])

  const statusCounts = Object.fromEntries(
    ORDER_STATUSES.map((s) => [s, 0])
  ) as Record<OrderStatus, number>
  let revenue = 0
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
    if (o.status !== "cancelled") revenue += o.total
  }

  // Revenue per day over the last 14 days.
  const days: { date: string; revenue: number }[] = []
  const byDay = new Map<string, number>()
  for (const o of orders) {
    if (o.status === "cancelled") continue
    const day = o.created_at.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + o.total)
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, revenue: Math.round((byDay.get(key) ?? 0) * 100) / 100 })
  }

  return {
    revenue: Math.round(revenue * 100) / 100,
    orderCount: orders.length,
    productCount: products.length,
    lowStockCount: lowStock.length,
    statusCounts,
    recentOrders: orders.slice(0, 8),
    lowStock: lowStock.slice(0, 8),
    revenueByDay: days,
  }
}
