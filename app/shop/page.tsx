import { Suspense } from "react"
import Link from "next/link"
import type { Metadata } from "next"

import {
  getCategories,
  getProducts,
  type ProductSort,
} from "@/lib/products"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { ShopControls } from "@/components/shop/shop-controls"

export const metadata: Metadata = {
  title: "Shop — BieLux",
}

type SearchParams = Record<string, string | string[] | undefined>

const VALID_SORTS: ProductSort[] = ["newest", "price-asc", "price-desc", "name"]

function str(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const q = str(sp.q)
  const categorySlug = str(sp.category)
  const rawFilter = str(sp.filter)
  const filter =
    rawFilter === "new" || rawFilter === "most-wanted" ? rawFilter : undefined
  const maxRaw = str(sp.max)
  const maxPrice = maxRaw ? Number(maxRaw) : undefined
  const rawSort = str(sp.sort) as ProductSort | undefined
  const sort = rawSort && VALID_SORTS.includes(rawSort) ? rawSort : "newest"

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      q,
      categorySlug,
      filter,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      sort,
    }),
  ])

  const activeCategory = categories.find((c) => c.slug === categorySlug)

  const title = q
    ? `Search: “${q}”`
    : filter === "new"
      ? "New Arrivals"
      : filter === "most-wanted"
        ? "Most Wanted"
        : activeCategory
          ? activeCategory.name
          : maxPrice
            ? `$${maxPrice} & Under`
            : "Shop All"

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            BieLux
          </p>
          <h1 className="mt-1 font-script text-5xl sm:text-6xl">{title}</h1>
        </div>

        <div className="mt-8 border-t pt-6">
          <Suspense fallback={<div className="h-10" />}>
            <ShopControls />
          </Suspense>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="font-heading text-2xl">Nothing here yet</p>
            <p className="max-w-sm text-muted-foreground">
              We couldn&apos;t find anything for this combination. Try clearing a
              filter or browsing everything.
            </p>
            <Link
              href="/shop"
              className="mt-2 inline-flex items-center border border-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-[0.18em] transition-colors hover:bg-foreground hover:text-background"
            >
              Shop all
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
