"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export type ProductInput = {
  name: string
  slug: string
  description: string
  price: number
  salePrice: number | null
  categoryId: string | null
  imageUrl: string
  hoverImageUrl: string | null
  badge: string | null
  /** Per-size stock. A single `{size: null}` entry means a one-size product. */
  variants: { size: string | null; quantity: number }[]
  isNew: boolean
  isMostWanted: boolean
  inStock: boolean
}

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function ensureUniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  base: string,
  excludeId?: string
): Promise<string> {
  const root = base || "product"
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = n === 1 ? root : `${root}-${n}`
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()
    if (!data || data.id === excludeId) return candidate
    n++
  }
}

function revalidateProductPaths(slug?: string) {
  revalidatePath("/admin/products")
  revalidatePath("/admin/inventory")
  revalidatePath("/admin")
  revalidatePath("/shop")
  revalidatePath("/")
  if (slug) revalidatePath(`/products/${slug}`)
}

function validate(input: ProductInput): string | null {
  if (!input.name?.trim()) return "Name is required."
  if (!input.imageUrl?.trim()) return "A main image is required."
  if (!(input.price >= 0)) return "Price must be 0 or more."
  if (input.salePrice != null && !(input.salePrice >= 0))
    return "Sale price must be 0 or more."
  if (!input.variants?.length) return "At least one stock entry is required."
  if (input.variants.some((v) => !(v.quantity >= 0)))
    return "Stock must be 0 or more."
  return null
}

// products.stock_quantity is a cached total kept in sync by a DB trigger, so it
// is intentionally not written here.
function toRow(input: ProductInput, slug: string) {
  return {
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || null,
    price: input.price,
    sale_price: input.salePrice,
    category_id: input.categoryId,
    image_url: input.imageUrl.trim(),
    hover_image_url: input.hoverImageUrl?.trim() || null,
    badge: input.badge?.trim() || null,
    is_new: input.isNew,
    is_most_wanted: input.isMostWanted,
    in_stock: input.inStock,
  }
}

/** Upsert a product's size variants and remove any sizes no longer offered. */
async function syncVariants(
  supabase: ReturnType<typeof createAdminClient>,
  productId: string,
  variants: { size: string | null; quantity: number }[]
) {
  const { data: existing } = await supabase
    .from("product_variants")
    .select("id, size")
    .eq("product_id", productId)

  const existingBySize = new Map<string | null, string>(
    (existing ?? []).map((v) => [(v.size as string | null) ?? null, v.id as string])
  )

  const keep = new Set<string>()
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]
    const size = v.size ?? null
    const quantity = Math.floor(v.quantity)
    const id = existingBySize.get(size)
    if (id) {
      keep.add(id)
      await supabase
        .from("product_variants")
        .update({ stock_quantity: quantity, sort_order: i })
        .eq("id", id)
    } else {
      await supabase.from("product_variants").insert({
        product_id: productId,
        size,
        stock_quantity: quantity,
        sort_order: i,
      })
    }
  }

  const toDelete = (existing ?? [])
    .map((v) => v.id as string)
    .filter((id) => !keep.has(id))
  if (toDelete.length) {
    await supabase.from("product_variants").delete().in("id", toDelete)
  }
}

export async function createProduct(
  input: ProductInput
): Promise<Result<{ id: string }>> {
  await requireAdmin()
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const supabase = createAdminClient()
  const slug = await ensureUniqueSlug(supabase, slugify(input.slug || input.name))
  const { data, error } = await supabase
    .from("products")
    .insert(toRow(input, slug))
    .select("id")
    .single()

  if (error || !data) return { ok: false, error: "Couldn't create the product." }
  await syncVariants(supabase, data.id, input.variants)
  revalidateProductPaths(slug)
  return { ok: true, id: data.id }
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<Result> {
  await requireAdmin()
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const supabase = createAdminClient()
  const slug = await ensureUniqueSlug(
    supabase,
    slugify(input.slug || input.name),
    id
  )
  const { error } = await supabase
    .from("products")
    .update(toRow(input, slug))
    .eq("id", id)

  if (error) return { ok: false, error: "Couldn't save the product." }
  await syncVariants(supabase, id, input.variants)
  revalidateProductPaths(slug)
  return { ok: true }
}

export async function deleteProduct(id: string): Promise<Result> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) return { ok: false, error: "Couldn't delete the product." }
  revalidateProductPaths()
  return { ok: true }
}

/** Quick publish/unpublish toggle from the product list. */
export async function setProductPublished(
  id: string,
  inStock: boolean
): Promise<Result> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .update({ in_stock: inStock })
    .eq("id", id)
  if (error) return { ok: false, error: "Couldn't update the product." }
  revalidateProductPaths()
  return { ok: true }
}

/** Inline per-size stock edit (used by the inventory view). */
export async function setVariantStock(
  variantId: string,
  quantity: number
): Promise<Result> {
  await requireAdmin()
  if (!(quantity >= 0)) return { ok: false, error: "Stock must be 0 or more." }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("product_variants")
    .update({ stock_quantity: Math.floor(quantity) })
    .eq("id", variantId)
  if (error) return { ok: false, error: "Couldn't update stock." }
  revalidateProductPaths()
  return { ok: true }
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Upload a product image to Storage and return its public URL. */
export async function uploadProductImage(
  formData: FormData
): Promise<Result<{ url: string }>> {
  await requireAdmin()
  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false, error: "No file provided." }
  if (!file.type.startsWith("image/"))
    return { ok: false, error: "Please choose an image file." }
  if (file.size > MAX_IMAGE_BYTES)
    return { ok: false, error: "Image must be under 5 MB." }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const path = `${randomUUID()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (error) return { ok: false, error: "Upload failed. Please try again." }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}
