import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { OrderLineItem } from "@/lib/checkout"
import type { Category, Variant } from "@/lib/products"
import { asSizeType } from "@/lib/sizes"
import {
  ORDER_STATUSES,
  LOW_STOCK_THRESHOLD,
  type OrderStatus,
} from "@/lib/admin/constants"

export { ORDER_STATUSES, LOW_STOCK_THRESHOLD }
export type { OrderStatus }

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
