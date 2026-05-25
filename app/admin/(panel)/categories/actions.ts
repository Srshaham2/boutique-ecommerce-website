"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { SIZE_TYPES, type SizeType } from "@/lib/sizes"

type Result = { ok: true } | { ok: false; error: string }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  base: string,
  excludeId?: string
): Promise<string> {
  const root = base || "category"
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = n === 1 ? root : `${root}-${n}`
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()
    if (!data || data.id === excludeId) return candidate
    n++
  }
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories")
  // The product form reads each category's size_type, so refresh it too.
  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidatePath("/")
}

export async function createCategory(
  name: string,
  sizeType: SizeType = "none"
): Promise<Result> {
  await requireAdmin()
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: "Enter a category name." }
  if (!SIZE_TYPES.includes(sizeType)) {
    return { ok: false, error: "Invalid size type." }
  }

  const supabase = createAdminClient()
  const slug = await uniqueSlug(supabase, slugify(trimmed))

  const { data: max } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const sortOrder = (max?.sort_order ?? 0) + 1

  const { error } = await supabase
    .from("categories")
    .insert({ name: trimmed, slug, sort_order: sortOrder, size_type: sizeType })
  if (error) return { ok: false, error: "Couldn't create the category." }

  revalidateCategoryPaths()
  return { ok: true }
}

/** Change a category's size system. Affects new/edited products going forward. */
export async function setCategorySizeType(
  id: string,
  sizeType: SizeType
): Promise<Result> {
  await requireAdmin()
  if (!SIZE_TYPES.includes(sizeType)) {
    return { ok: false, error: "Invalid size type." }
  }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("categories")
    .update({ size_type: sizeType })
    .eq("id", id)
  if (error) return { ok: false, error: "Couldn't update the size type." }

  revalidateCategoryPaths()
  return { ok: true }
}

export async function updateCategory(id: string, name: string): Promise<Result> {
  await requireAdmin()
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: "Enter a category name." }

  const supabase = createAdminClient()
  const slug = await uniqueSlug(supabase, slugify(trimmed), id)
  const { error } = await supabase
    .from("categories")
    .update({ name: trimmed, slug })
    .eq("id", id)
  if (error) return { ok: false, error: "Couldn't rename the category." }

  revalidateCategoryPaths()
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<Result> {
  await requireAdmin()
  const supabase = createAdminClient()

  // Don't orphan products via a foreign-key error — require an empty category.
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: "Move or remove this category's products before deleting it.",
    }
  }

  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { ok: false, error: "Couldn't delete the category." }

  revalidateCategoryPaths()
  return { ok: true }
}

/** Persist a new category order by writing each id's index as its sort_order. */
export async function reorderCategories(orderedIds: string[]): Promise<Result> {
  await requireAdmin()
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return { ok: true }
  const supabase = createAdminClient()

  // Guard against a stale client list (added/removed elsewhere) clobbering rows.
  const { data: rows } = await supabase.from("categories").select("id")
  if (!rows) return { ok: false, error: "Couldn't reorder." }
  const known = new Set(rows.map((r) => r.id as string))
  if (rows.length !== orderedIds.length || orderedIds.some((id) => !known.has(id))) {
    return { ok: false, error: "List is out of date — refresh and try again." }
  }

  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from("categories").update({ sort_order: i + 1 }).eq("id", id)
    )
  )
  if (results.some((r) => r.error)) {
    return { ok: false, error: "Couldn't save the new order." }
  }

  revalidateCategoryPaths()
  return { ok: true }
}
