import "server-only"

import { createClient } from "@/lib/supabase/server"

export type Category = {
  id: string
  name: string
  slug: string
  sort_order: number
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
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

const PRODUCT_SELECT = "*, category:categories(name, slug)"

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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle()

  if (error) throw error
  return data ? normalize(data) : null
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
