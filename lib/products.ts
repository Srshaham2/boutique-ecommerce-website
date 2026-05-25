import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { SizeType } from "@/lib/sizes"

export type Category = {
  id: string
  name: string
  slug: string
  sort_order: number
  size_type: SizeType
}

/** A single purchasable size of a product. `size` is null for one-size items. */
export type Variant = {
  id: string
  size: string | null
  stock_quantity: number
}

export type Product = {
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
  created_at: string
  category: { name: string; slug: string } | null
}

/** Product plus its per-size variants, used on the product detail page. */
export type ProductWithVariants = Product & { variants: Variant[] }

const PRODUCT_SELECT = "*, category:categories(name, slug)"
// Detail pages also need the per-size variants for the size selector.
const PRODUCT_DETAIL_SELECT =
  "*, category:categories(name, slug), variants:product_variants(id, size, stock_quantity, sort_order)"

export type ProductSort = "newest" | "price-asc" | "price-desc" | "name"

export type ProductQuery = {
  categorySlug?: string
  q?: string
  filter?: "new" | "most-wanted"
  maxPrice?: number
  sort?: ProductSort
  limit?: number
}

function normalize(row: Record<string, unknown>): Product {
  return {
    ...(row as Product),
    price: Number(row.price),
    sale_price: row.sale_price == null ? null : Number(row.sale_price),
  }
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) throw error
  return (data ?? []) as Category[]
}

export async function getProducts(opts: ProductQuery = {}): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase.from("products").select(PRODUCT_SELECT)

  if (opts.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle()
    // Unknown category → no results rather than all results
    query = query.eq("category_id", cat?.id ?? "00000000-0000-0000-0000-000000000000")
  }

  if (opts.q) {
    const term = `%${opts.q}%`
    query = query.or(`name.ilike.${term},description.ilike.${term}`)
  }

  if (opts.filter === "new") query = query.eq("is_new", true)
  if (opts.filter === "most-wanted") query = query.eq("is_most_wanted", true)
  if (typeof opts.maxPrice === "number") query = query.lte("price", opts.maxPrice)

  switch (opts.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true })
      break
    case "price-desc":
      query = query.order("price", { ascending: false })
      break
    case "name":
      query = query.order("name", { ascending: true })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  if (opts.limit) query = query.limit(opts.limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(normalize)
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithVariants | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("slug", slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const raw = data as Record<string, unknown>
  const variants = ((raw.variants as Record<string, unknown>[]) ?? [])
    .map((v) => ({
      id: v.id as string,
      size: (v.size as string | null) ?? null,
      stock_quantity: Number(v.stock_quantity),
      sort_order: Number(v.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ id, size, stock_quantity }) => ({ id, size, stock_quantity }))

  return { ...normalize(raw), variants }
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .neq("id", product.id)
    .limit(limit)

  if (product.category_id) query = query.eq("category_id", product.category_id)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(normalize)
}
