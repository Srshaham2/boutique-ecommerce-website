"use client"

import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"
import { toast } from "sonner"

import { cn, formatPrice } from "@/lib/utils"
import { useCart } from "@/components/cart/cart-provider"

export type ProductCardData = {
  id: string
  name: string
  slug: string
  price: number
  image_url: string
  hover_image_url?: string | null
  badge?: string | null
  category?: { name: string; slug: string } | null
}

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData
  className?: string
}) {
  const { addItem } = useCart()

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault()
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image_url: product.image_url,
      },
      { quantity: 1 }
    )
    toast.success(`${product.name} added to your bag`)
  }

  return (
    <Link href={`/products/${product.slug}`} className={cn("group block", className)}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {product.badge ? (
          <span className="absolute left-3 top-3 z-10 bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
            {product.badge}
          </span>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105",
            product.hover_image_url && "group-hover:opacity-0"
          )}
        />
        {product.hover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.hover_image_url}
            alt=""
            loading="lazy"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : null}

        {/* Quick add */}
        <button
          type="button"
          onClick={quickAdd}
          className="absolute inset-x-3 bottom-3 z-10 flex translate-y-2 items-center justify-center gap-2 bg-background/95 py-2.5 text-xs font-medium uppercase tracking-[0.15em] opacity-0 shadow-sm backdrop-blur transition-all duration-300 hover:bg-foreground hover:text-background group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBagIcon className="size-4" />
          Add to bag
        </button>
      </div>

      <div className="mt-4 text-center">
        <h3 className="font-heading text-lg text-foreground">{product.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  )
}
