import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ChevronRightIcon, RotateCcwIcon, TruckIcon } from "lucide-react"

import { getProductBySlug, getRelatedProducts } from "@/lib/products"
import { formatPrice, priceView } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductPurchase } from "@/components/product-purchase"
import { ProductCard } from "@/components/product-card"

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: "Not found — BieLux" }
  return {
    title: `${product.name} — BieLux`,
    description: product.description ?? undefined,
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product, 4)
  const price = priceView(product.price, product.sale_price)

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRightIcon className="size-3.5" />
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          {product.category ? (
            <>
              <ChevronRightIcon className="size-3.5" />
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="hover:text-foreground"
              >
                {product.category.name}
              </Link>
            </>
          ) : null}
          <ChevronRightIcon className="size-3.5" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
            {product.badge ? (
              <span className="absolute left-4 top-4 z-10 bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
                {product.badge}
              </span>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Info */}
          <div className="lg:py-6">
            {product.category ? (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {product.category.name}
              </p>
            ) : null}
            <h1 className="mt-2 font-heading text-4xl">{product.name}</h1>
            {price.onSale ? (
              <p className="mt-3 flex items-baseline gap-3">
                <span className="text-xl tabular-nums">
                  {formatPrice(price.current)}
                </span>
                <span className="text-lg tabular-nums text-muted-foreground line-through">
                  {formatPrice(price.original)}
                </span>
              </p>
            ) : (
              <p className="mt-3 text-xl tabular-nums">
                {formatPrice(product.price)}
              </p>
            )}

            {product.description ? (
              <p className="mt-6 leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            ) : null}

            <div className="mt-8">
              <ProductPurchase
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: price.current,
                  image_url: product.image_url,
                }}
              />
            </div>

            <div className="mt-8 space-y-3 border-t pt-6 text-sm text-muted-foreground">
              <p className="flex items-center gap-3">
                <TruckIcon className="size-4 shrink-0" />
                Free express shipping on orders over $75
              </p>
              <p className="flex items-center gap-3">
                <RotateCcwIcon className="size-4 shrink-0" />
                Easy 30-day returns
              </p>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 ? (
          <section className="mt-24">
            <h2 className="text-center font-script text-4xl sm:text-5xl">
              You may also like
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
