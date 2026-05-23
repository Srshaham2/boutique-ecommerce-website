import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { getCategories, getProducts } from "@/lib/products"
import { SiteHeader } from "@/components/site-header"
import { HeroCarousel } from "@/components/hero-carousel"
import { ProductCard } from "@/components/product-card"
import { SiteFooter } from "@/components/site-footer"

// Editorial imagery per category for the "Shop by Category" tiles
const categoryImage: Record<string, string> = {
  dresses:
    "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=900&q=80",
  sets: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  pants:
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80",
  shoes:
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80",
  accessories:
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
}

export default async function Page() {
  const [featured, categories] = await Promise.all([
    getProducts({ sort: "newest", limit: 8 }),
    getCategories(),
  ])

  return (
    <div className="flex min-h-svh flex-col">
      {/* Announcement bar */}
      <div className="bg-foreground py-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-background">
        Free shipping on orders over $75 · Easy 30-day returns
      </div>

      <SiteHeader />

      <main className="flex-1">
        <HeroCarousel />

        {/* Featured products */}
        <section id="shop" className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Just dropped
            </p>
            <h2 className="mt-1 font-script text-5xl sm:text-6xl">New This Week</h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border border-foreground px-8 py-3 text-xs font-medium uppercase tracking-[0.18em] transition-colors hover:bg-foreground hover:text-background"
            >
              Shop all
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </section>

        {/* Shop by category */}
        <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
          <h2 className="text-center font-script text-5xl sm:text-6xl">
            Shop by Category
          </h2>
          <div className="mt-12 grid gap-4 grid-cols-2 sm:gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group relative aspect-[4/5] overflow-hidden bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={categoryImage[category.slug] ?? categoryImage.dresses}
                  alt={category.name}
                  loading="lazy"
                  className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" />
                <div className="absolute inset-0 flex items-end p-6">
                  <span className="inline-flex items-center gap-2 font-heading text-2xl text-white">
                    {category.name}
                    <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Promo banner */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-20 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              The edit
            </p>
            <h2 className="mt-2 font-script text-5xl sm:text-6xl">$40 &amp; Under</h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Everyday pieces that don&apos;t cost the earth. Refresh your
              rotation without the splurge.
            </p>
            <Link
              href="/shop?max=40"
              className="mt-8 inline-flex items-center gap-2 bg-foreground px-8 py-3 text-xs font-medium uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90"
            >
              Shop the edit
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
